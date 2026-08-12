ALTER TABLE profiles
ADD COLUMN check_in_frequency integer
CHECK (check_in_frequency IN (2, 3, 5));;
