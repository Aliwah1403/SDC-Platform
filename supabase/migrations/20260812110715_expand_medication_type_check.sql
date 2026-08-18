alter table public.medications
  drop constraint if exists medications_type_check;

alter table public.medications
  add constraint medications_type_check
  check (
    type = any (
      array[
        'tablet'::text,
        'capsule'::text,
        'softgel'::text,
        'liquid'::text,
        'ointment'::text,
        'inhaler'::text,
        'injection'::text,
        'chewable'::text,
        'drops'::text,
        'effervescent'::text,
        'enema'::text,
        'lozenge'::text,
        'mouthwash'::text,
        'nasal-spray'::text,
        'patch'::text,
        'powder'::text,
        'spray'::text,
        'suppository'::text,
        'other'::text
      ]
    )
  );
