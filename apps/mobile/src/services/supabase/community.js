import { supabase } from '@/utils/auth/supabase';
import { toCamelCase } from '@/utils/caseMapping';


// ============================================================
// COMMUNITY
// ============================================================

// ── Feed ──────────────────────────────────────────────────────────────────

/**
 * Fetch community posts for a given feed filter.
 *
 * filter: 'popular' | 'recent' | 'following' | 'mine' | 'saved'
 * followedCategoryIds: string[] (needed for 'following' filter)
 * blockedCategoryIds:  string[] (always excluded)
 */
export async function fetchCommunityFeed({
  userId,
  filter = 'popular',
  categoryId = null,
  followedCategoryIds = [],
  blockedCategoryIds = [],
  limit = 30,
  offset = 0,
}) {
  // Base query: posts + author profile (nickname + scd_type) + like/save status
  let query = supabase
    .from('community_posts')
    .select(`
      *,
      author:profiles!community_posts_user_id_fkey(nickname, scd_type, avatar_url),
      is_liked:community_likes!left(user_id),
      is_saved:community_saves!left(user_id),
      poll_options:community_poll_options(id, option_text, sort_order, vote_count),
      user_poll_vote:community_poll_votes!left(option_id)
    `)
    .eq('is_liked.user_id', userId)
    .eq('is_saved.user_id', userId)
    .eq('user_poll_vote.user_id', userId)
    .range(offset, offset + limit - 1);

  // Exclude blocked categories
  if (blockedCategoryIds.length > 0) {
    query = query.not('category', 'in', `(${blockedCategoryIds.join(',')})`);
  }

  // Apply feed-specific filters
  if (filter === 'popular') {
    query = query.order('like_count', { ascending: false });
  } else if (filter === 'recent') {
    query = query.order('created_at', { ascending: false });
  } else if (filter === 'following') {
    if (followedCategoryIds.length === 0) return [];
    query = query
      .in('category', followedCategoryIds)
      .order('created_at', { ascending: false });
  } else if (filter === 'mine') {
    query = query
      .eq('user_id', userId)
      .eq('is_system_post', false)
      .order('created_at', { ascending: false });
  } else if (filter === 'saved') {
    // For saved, join differently — just fetch saves and match
    const { data: saves, error: savesErr } = await supabase
      .from('community_saves')
      .select('post_id')
      .eq('user_id', userId);
    if (savesErr) throw savesErr;
    const savedIds = saves.map((s) => s.post_id);
    if (savedIds.length === 0) return [];
    query = query.in('id', savedIds).order('created_at', { ascending: false });
  } else if (filter === 'category') {
    query = query
      .eq('category', categoryId)
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((p) => normaliseCommunityPost(p, userId));
}
/**
 * Fetch a single post with all top-level comments and their replies.
 */
export async function fetchPostDetail(postId, userId) {
  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .select(`
      *,
      author:profiles!community_posts_user_id_fkey(nickname, scd_type, avatar_url),
      is_liked:community_likes!left(user_id),
      is_saved:community_saves!left(user_id),
      poll_options:community_poll_options(id, option_text, sort_order, vote_count),
      user_poll_vote:community_poll_votes!left(option_id)
    `)
    .eq('is_liked.user_id', userId)
    .eq('is_saved.user_id', userId)
    .eq('user_poll_vote.user_id', userId)
    .eq('id', postId)
    .single();
  if (postErr) throw postErr;

  // Fetch top-level comments
  const { data: comments, error: commentsErr } = await supabase
    .from('community_comments')
    .select(`
      *,
      author:profiles!community_comments_user_id_fkey(nickname, avatar_url)
    `)
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });
  if (commentsErr) throw commentsErr;

  // Fetch all replies for this post in one query
  const { data: replies, error: repliesErr } = await supabase
    .from('community_comments')
    .select(`
      *,
      author:profiles!community_comments_user_id_fkey(nickname, avatar_url)
    `)
    .eq('post_id', postId)
    .not('parent_comment_id', 'is', null)
    .order('created_at', { ascending: true });
  if (repliesErr) throw repliesErr;

  // Group replies under their parent comments
  const replyMap = {};
  (replies ?? []).forEach((r) => {
    const pid = r.parent_comment_id;
    if (!replyMap[pid]) replyMap[pid] = [];
    replyMap[pid].push(normaliseComment(r, userId));
  });

  const normalisedComments = (comments ?? []).map((c) => ({
    ...normaliseComment(c, userId),
    replies: replyMap[c.id] ?? [],
  }));

  return {
    ...normaliseCommunityPost(post, userId),
    comments: normalisedComments,
  };
}

// ── Posts ─────────────────────────────────────────────────────────────────

export async function createCommunityPost({
  userId,
  content,
  imageUrl,
  category,
  flair,
  isAnonymous = false,
  pollOptions = [], // string[] — option texts, empty if no poll
}) {
  // If imageUrl is a local device URI, upload it to Storage first
  let storedImageUrl = null;
  if (imageUrl) {
    const isLocal = imageUrl.startsWith('file://') || imageUrl.startsWith('ph://');
    if (isLocal) {
      const ext = 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from('community-images')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from('community-images')
        .getPublicUrl(path);
      storedImageUrl = urlData.publicUrl;
    } else {
      // Already a remote URL (e.g. re-used from another post)
      storedImageUrl = imageUrl;
    }
  }

  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .insert({
      user_id: userId,
      content,
      image_url: storedImageUrl,
      category,
      flair: flair ?? null,
      is_anonymous: isAnonymous,
    })
    .select('id')
    .single();
  if (postErr) throw postErr;

  if (pollOptions.length >= 2) {
    const options = pollOptions.map((text, i) => ({
      post_id: post.id,
      option_text: text,
      sort_order: i,
    }));
    const { error: optErr } = await supabase
      .from('community_poll_options')
      .insert(options);
    if (optErr) throw optErr;
  }

  return post.id;
}

export async function deleteCommunityPost(postId, userId) {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Likes ─────────────────────────────────────────────────────────────────

export async function likePost(userId, postId) {
  const { error } = await supabase
    .from('community_likes')
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unlikePost(userId, postId) {
  const { error } = await supabase
    .from('community_likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

// ── Saves ─────────────────────────────────────────────────────────────────

export async function savePost(userId, postId) {
  const { error } = await supabase
    .from('community_saves')
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error;
}

export async function unsavePost(userId, postId) {
  const { error } = await supabase
    .from('community_saves')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

// ── Reports ───────────────────────────────────────────────────────────────

export async function reportCommunityPost(userId, postId, reason, description = '') {
  const { error } = await supabase
    .from('community_reports')
    .insert({ reporter_id: userId, post_id: postId, reason, description: description || null });
  if (error && error.code !== '23505') throw error; // ignore duplicate report
}

export async function reportCommunityComment(userId, commentId, reason, description = '') {
  const { error } = await supabase
    .from('community_comment_reports')
    .insert({ reporter_id: userId, comment_id: commentId, reason, description: description || null });
  if (error && error.code !== '23505') throw error; // ignore duplicate report
}

// ── Comments ─────────────────────────────────────────────────────────────

export async function addComment(userId, postId, content) {
  const { data, error } = await supabase
    .from('community_comments')
    .insert({ user_id: userId, post_id: postId, content, parent_comment_id: null })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function addReply(userId, postId, parentCommentId, replyingToName, content) {
  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      user_id: userId,
      post_id: postId,
      parent_comment_id: parentCommentId,
      replying_to_name: replyingToName,
      content,
    })
    .select('id, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// ── Polls ─────────────────────────────────────────────────────────────────

/**
 * Vote on a poll. If the user has already voted on this post, the old vote
 * is deleted first (change-vote). The trigger handles vote_count updates.
 */
export async function voteOnPoll(userId, postId, optionId) {
  // Delete previous vote first (no-op if none exists)
  await supabase
    .from('community_poll_votes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  const { error } = await supabase
    .from('community_poll_votes')
    .insert({ user_id: userId, post_id: postId, option_id: optionId });
  if (error) throw error;
}

// ── Category preferences ──────────────────────────────────────────────────

export async function fetchCategoryPreferences(userId) {
  const { data, error } = await supabase
    .from('community_category_preferences')
    .select('category_id, action')
    .eq('user_id', userId);
  if (error) throw error;

  const followed = [];
  const blocked = [];
  (data ?? []).forEach((row) => {
    if (row.action === 'follow') followed.push(row.category_id);
    else if (row.action === 'block') blocked.push(row.category_id);
  });
  return { followedCategoryIds: followed, blockedCategoryIds: blocked };
}

export async function upsertCategoryPreference(userId, categoryId, action) {
  const { error } = await supabase
    .from('community_category_preferences')
    .upsert({ user_id: userId, category_id: categoryId, action });
  if (error) throw error;
}

export async function deleteCategoryPreference(userId, categoryId) {
  const { error } = await supabase
    .from('community_category_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('category_id', categoryId);
  if (error) throw error;
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function fetchCommunityNotifications(userId) {
  const { data, error } = await supabase
    .from('community_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(toCamelCase);
}

export async function markAllCommunityNotificationsRead(userId) {
  const { error } = await supabase
    .from('community_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

export async function fetchSystemNotifications(userId) {
  const { data, error } = await supabase
    .from('system_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(toCamelCase);
}

export async function markAllSystemNotificationsRead(userId) {
  const { error } = await supabase
    .from('system_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

// ── Normalisation helpers ─────────────────────────────────────────────────

function normaliseCommunityPost(row, currentUserId) {
  const isCurrentUser = row.user_id === currentUserId;
  // PostgREST returns the joined row as an array when the FK targets a non-PK
  // unique column (profiles.user_id). Unwrap it here.
  const author = Array.isArray(row.author) ? (row.author[0] ?? {}) : (row.author ?? {});

  return {
    id: row.id,
    author: row.is_anonymous && !isCurrentUser
      ? { id: null, name: 'Anonymous', avatarInitials: '??', scdType: null, isCurrentUser: false }
      : {
          id: row.user_id,
          name: author.nickname ?? 'Unknown',
          avatarInitials: initials(author.nickname ?? 'U'),
          scdType: author.scd_type ?? null,
          isCurrentUser,
        },
    content: row.content,
    imageUrl: row.image_url ?? null,
    category: row.category,
    flair: row.flair ?? null,
    isAnonymous: row.is_anonymous,
    isSystemPost: row.is_system_post,
    systemCategory: row.system_category ?? null,
    isDiscussionPrompt: row.is_discussion_prompt,
    likes: row.like_count,
    commentCount: row.comment_count,
    timestamp: row.created_at,
    isLiked: Array.isArray(row.is_liked) ? row.is_liked.length > 0 : false,
    isSaved: Array.isArray(row.is_saved) ? row.is_saved.length > 0 : false,
    poll: normalisePoll(row.poll_options, row.user_poll_vote),
    comments: [],
  };
}

function normaliseComment(row, currentUserId) {
  const author = Array.isArray(row.author) ? (row.author[0] ?? {}) : (row.author ?? {});
  return {
    id: row.id,
    author: {
      userId: row.user_id,
      name: author.nickname ?? 'Unknown',
      avatarInitials: initials(author.nickname ?? 'U'),
    },
    content: row.content,
    timestamp: row.created_at,
    replyingToName: row.replying_to_name ?? null,
    isCurrentUser: row.user_id === currentUserId,
  };
}

function normalisePoll(options, userVote) {
  if (!options || options.length === 0) return null;
  const votedOptionId = Array.isArray(userVote) && userVote.length > 0
    ? userVote[0].option_id
    : null;
  return {
    options: options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ id: o.id, text: o.option_text, votes: o.vote_count })),
    votedOptionId,
  };
}

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
