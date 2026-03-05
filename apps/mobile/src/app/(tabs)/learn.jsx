import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Send,
  Trash2,
  MessageCircle,
  Bot,
  User,
  Lightbulb,
  Heart,
  Activity,
  BookOpen,
} from "lucide-react-native";
import { useAppStore } from "../../store/appStore";
import { mockArticles } from "../../types";

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { chatMessages, addChatMessage, clearChat, setTyping, isTyping } =
    useAppStore();

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollViewRef.current && chatMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: "user",
      timestamp: new Date(),
    };

    addChatMessage(userMessage);
    setInputText("");
    setIsLoading(true);
    setTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I understand your concern about sickle cell symptoms. Managing pain is crucial for your wellbeing. Have you been following your prescribed medication schedule?",
        "Based on your symptom patterns, it might be helpful to stay well-hydrated and monitor your stress levels. Would you like some specific hydration tips?",
        "Pain crises can be challenging. It's important to rest and seek medical attention if the pain becomes severe. How has your pain level been today?",
        "Exercise can be beneficial for people with sickle cell disease when done safely. Low-impact activities like walking or swimming are often recommended. What's your current activity level?",
        "Nutrition plays a role in managing SCD. Foods rich in folate, like leafy greens, can be particularly helpful. Are you taking folic acid supplements as prescribed?",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        role: "assistant",
        timestamp: new Date(),
        metadata: {
          type: "general",
          confidence: 0.85,
        },
      };

      addChatMessage(aiMessage);
      setIsLoading(false);
      setTyping(false);
    }, 1500);
  };

  const handleClearChat = () => {
    Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearChat },
    ]);
  };

  const quickQuestions = [
    {
      id: 1,
      text: "How can I manage pain?",
      icon: Activity,
      color: "#EF4444",
    },
    {
      id: 2,
      text: "Hydration tips for SCD",
      icon: Heart,
      color: "#0EA5E9",
    },
    {
      id: 3,
      text: "Safe exercise routines",
      icon: Activity,
      color: "#059669",
    },
    {
      id: 4,
      text: "Nutrition guidelines",
      icon: Lightbulb,
      color: "#F59E0B",
    },
  ];

  const QuickQuestion = ({ question, onPress }) => (
    <TouchableOpacity
      onPress={() => onPress(question.text)}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        minWidth: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            backgroundColor: `${question.color}15`,
            borderRadius: 6,
            padding: 6,
            marginRight: 8,
          }}
        >
          <question.icon size={16} color={question.color} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#111827",
            flex: 1,
          }}
        >
          {question.text}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 12,
          color: "#6B7280",
        }}
      >
        Ask AI assistant →
      </Text>
    </TouchableOpacity>
  );

  const MessageBubble = ({ message }) => {
    const isUser = message.role === "user";

    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: 16,
          alignItems: "flex-end",
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <View
            style={{
              backgroundColor: "#FEF3F2",
              borderRadius: 20,
              padding: 8,
              marginRight: 8,
              marginBottom: 4,
            }}
          >
            <Bot size={20} color="#DC2626" />
          </View>
        )}

        <View
          style={{
            backgroundColor: isUser ? "#DC2626" : "#ffffff",
            borderRadius: 16,
            padding: 16,
            maxWidth: "75%",
            borderWidth: isUser ? 0 : 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: isUser ? "#ffffff" : "#111827",
              lineHeight: 22,
            }}
          >
            {message.content}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: isUser ? "#FCA5A5" : "#6B7280",
              marginTop: 4,
            }}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {isUser && (
          <View
            style={{
              backgroundColor: "#FEF3F2",
              borderRadius: 20,
              padding: 8,
              marginLeft: 8,
              marginBottom: 4,
            }}
          >
            <User size={20} color="#DC2626" />
          </View>
        )}
      </View>
    );
  };

  const TypingIndicator = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 16,
      }}
    >
      <View
        style={{
          backgroundColor: "#FEF3F2",
          borderRadius: 20,
          padding: 8,
          marginRight: 8,
          marginBottom: 4,
        }}
      >
        <Bot size={20} color="#DC2626" />
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            fontStyle: "italic",
          }}
        >
          AI is thinking...
        </Text>
      </View>
    </View>
  );

  const ArticleCard = ({ article }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        width: 280,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View
        style={{
          backgroundColor: "#FEF3F2",
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignSelf: "flex-start",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: "#DC2626",
            fontWeight: "500",
            textTransform: "capitalize",
          }}
        >
          {article.category}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 8,
          lineHeight: 22,
        }}
      >
        {article.title}
      </Text>

      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 18,
          marginBottom: 12,
        }}
      >
        {article.summary}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: "#9CA3AF",
          }}
        >
          {article.readTime} min read
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "#DC2626",
            fontWeight: "500",
          }}
        >
          Read More →
        </Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          backgroundColor: "#FEF3F2",
          borderRadius: 40,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <MessageCircle size={40} color="#DC2626" />
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#111827",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Hemo AI Assistant
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        Get personalized health guidance, ask questions about sickle cell
        management, and learn from expert resources.
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          textAlign: "center",
        }}
      >
        Start a conversation below or try one of the quick questions!
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              Learn & Ask AI
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
              }}
            >
              Get personalized health guidance
            </Text>
          </View>

          {chatMessages.length > 0 && (
            <TouchableOpacity
              onPress={handleClearChat}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Trash2 size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Questions */}
        {chatMessages.length === 0 && (
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Quick Questions
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {quickQuestions.map((question) => (
                <QuickQuestion
                  key={question.id}
                  question={question}
                  onPress={(text) => setInputText(text)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 20,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {chatMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isTyping && <TypingIndicator />}
            </>
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: "#111827",
                maxHeight: 100,
                paddingVertical: 8,
              }}
              placeholder="Ask about sickle cell management..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              style={{
                backgroundColor: inputText.trim() ? "#DC2626" : "#E5E7EB",
                borderRadius: 16,
                padding: 10,
                marginLeft: 8,
              }}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Articles Section (when no chat) */}
      {chatMessages.length === 0 && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            paddingVertical: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginHorizontal: 20,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Recommended Reading
            </Text>

            <TouchableOpacity>
              <Text
                style={{
                  fontSize: 14,
                  color: "#DC2626",
                  fontWeight: "500",
                }}
              >
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {mockArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
