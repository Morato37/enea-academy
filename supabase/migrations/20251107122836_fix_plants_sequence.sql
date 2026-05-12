/*
  # Fix plants sequence

  The plants_id_seq sequence is out of sync with the actual data.
  Current sequence value: 6
  Actual max ID in table: 573
  
  This migration resets the sequence to the correct value.
*/

SELECT setval('plants_id_seq', (SELECT MAX(id) FROM plants));
