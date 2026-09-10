-- Demo data, loaded on startup by Spring after Hibernate has created the tables.
--
-- INSERT IGNORE with explicit ids makes this safe to run on every start: a row
-- whose id already exists is skipped rather than duplicated, and the ids stay
-- fixed so the README test table and the demo script keep matching.
--
-- TIMES ARE STORED UTC, which is what the application reads and writes.
-- Philadelphia runs four hours behind UTC on daylight time, so a 2:00 PM visit
-- is written here as 18:00. Visits happening right now are offsets from
-- UTC_TIMESTAMP() instead, because both attention thresholds are measured in
-- minutes from an event rather than from a wall clock time.
--
-- Offsets, never literal dates. A seed full of fixed dates is honest the week
-- it is written: this one went two months stale once, and by then every
-- scheduled visit read as a late check-in and every visit in progress as a
-- forgotten check-out. Everything flagged reads the same as nothing flagged.

INSERT IGNORE INTO patients (id, name, phone, address, standing_concerns) VALUES
(1,  'Eleanor Whitfield', '215-555-0231', '1642 S Broad St, Philadelphia, PA 19145',   'Unsteady on stairs after dark. Prefers help with bathing earlier in the day.'),
(2,  'Samuel Okafor',     '215-555-0244', '5310 Chestnut St, Philadelphia, PA 19139',  'Appetite is inconsistent; meals need encouragement. Reminders for evening medication.'),
(3,  'Rosa Delgado',      '215-555-0198', '2708 N 5th St, Philadelphia, PA 19133',     'Wants to keep walking daily while she can. Spanish is her first language.'),
(4,  'Harold Brennan',    '215-555-0176', '812 Fitzwater St, Philadelphia, PA 19147',  'Knee replacement recovery. Physical therapy set is the priority every visit.'),
(5,  'Miriam Katz',       '215-555-0159', '7401 Old York Rd, Elkins Park, PA 19027',   'Lives alone and values the company. Hard of hearing on the left side.'),
(6,  'George Antonelli',  '215-555-0287', '1919 S 10th St, Philadelphia, PA 19148',    'Low vision. Labels and paperwork need reading aloud.'),
(7,  'Pearl Jackson',     '215-555-0134', '4522 Baltimore Ave, Philadelphia, PA 19143','Daughter handles paperwork and often signs. Prefers a familiar caregiver.'),
(8,  'Dorothy Chen',      '215-555-0265', '1030 Race St, Philadelphia, PA 19107',      'Wound care on the left forearm per care plan. Dressing changed each visit.'),
(9,  'Walter Osei',       '215-555-0212', '6218 Chew Ave, Philadelphia, PA 19138',     'Diabetic. Watches blood sugar closely and wants meals kept on schedule.'),
(10, 'Agnes Romano',      '215-555-0221', '2436 E Cumberland St, Philadelphia, PA 19125', 'Medication cabinet is disorganised and labels are too small for her to read.');

INSERT IGNORE INTO caregivers (id, name, phone) VALUES
(1, 'Marcus Reed',     '215-555-0142'),
(2, 'Dana Alvarez',    '215-555-0187'),
(3, 'Keisha Thompson', '215-555-0116'),
(4, 'Luis Rivera',     '215-555-0163'),
(5, 'Angela Brooks',   '215-555-0129');

-- Yesterday's work: two visits missing evidence, three ready to bill, one billed.
INSERT IGNORE INTO visits
    (id, patient_id, caregiver_id, appointment_time, status, service_type, estimated_cost,
     check_in_time, check_out_time, assessment, signature, patient_concern) VALUES

(1, 1, 1, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '18:00:00'), 'NEEDS_REVIEW', 'PERSONAL_CARE', 34.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '18:02:00'), TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '19:01:00'),
 'Patient alert and in good spirits. Assisted with bathing and lunch. Mild swelling in left ankle, family notified.',
 NULL,
 'Worried about managing the stairs alone at night; asked if evening visits could start earlier.'),

(2, 2, 2, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '20:30:00'), 'NEEDS_REVIEW', 'HOMEMAKER', 51.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '20:33:00'), NULL,
 'Medication reminder completed. Prepared dinner, patient ate half portion.',
 NULL, NULL),

(3, 3, 1, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '13:00:00'), 'READY_TO_BILL', 'PERSONAL_CARE', 52.50,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '12:58:00'), TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '14:30:00'),
 'Morning routine assistance. Vitals stable, patient walked to mailbox and back without difficulty.',
 'Rosa Delgado',
 'Freezer stopped working and she is worried about meals for the weekend.'),

(4, 4, 3, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '15:30:00'), 'READY_TO_BILL', 'PERSONAL_CARE', 56.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '15:29:00'), TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '17:05:00'),
 'Physical therapy exercises completed, full set. Patient reports less knee pain than last week.',
 'Harold Brennan', NULL),

-- Happening now. Visit 5 is comfortably inside the two hour window; visit 9 has
-- deliberately run past it, which is the only missing check-out flag on screen.
(5, 5, 1, UTC_TIMESTAMP() - INTERVAL 50 MINUTE, 'IN_PROGRESS', 'RESPITE_CARE', 42.00,
 UTC_TIMESTAMP() - INTERVAL 45 MINUTE, NULL, NULL, NULL, NULL),

-- Forty minutes past its appointment with no check-in, so this is the one late
-- check-in. The grace period is fifteen minutes.
(6, 6, 1, UTC_TIMESTAMP() - INTERVAL 40 MINUTE, 'SCHEDULED', 'HOMEMAKER', 38.50,
 NULL, NULL, NULL, NULL, NULL),

(7, 7, 1, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '12:00:00'), 'BILLED', 'PERSONAL_CARE', 45.50,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '11:57:00'), TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '13:15:00'),
 'Overnight recap reviewed. Breakfast and morning medications administered on schedule.',
 'P. Jackson (daughter)',
 'Asked whether the same caregiver can come Fridays, prefers familiar faces.'),

(8, 8, 3, TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '14:00:00'), 'READY_TO_BILL', 'PERSONAL_CARE', 63.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '13:58:00'), TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '15:45:00'),
 'Wound dressing changed per care plan. Range-of-motion exercises completed, patient tolerated well.',
 'Dorothy Chen', NULL),

(9, 9, 2, UTC_TIMESTAMP() - INTERVAL 195 MINUTE, 'IN_PROGRESS', 'COMPANION_CARE', 47.00,
 UTC_TIMESTAMP() - INTERVAL 190 MINUTE, NULL, NULL, NULL, NULL),

(10, 10, 1, UTC_TIMESTAMP() + INTERVAL 120 MINUTE, 'SCHEDULED', 'PERSONAL_CARE', 40.00,
 NULL, NULL, NULL, NULL,
 'Wants help reorganizing the medication cabinet; labels are too small to read.'),

-- Older billed work, so the patient records and the caregiver histories have
-- something in them beyond yesterday.
(11, 1, 1, TIMESTAMP(UTC_DATE() - INTERVAL 15 DAY, '18:00:00'), 'BILLED', 'PERSONAL_CARE', 34.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 15 DAY, '17:58:00'), TIMESTAMP(UTC_DATE() - INTERVAL 15 DAY, '19:04:00'),
 'Bathing and lunch as usual. Ankle swelling unchanged from last week.',
 'Eleanor Whitfield', NULL),

(12, 1, 3, TIMESTAMP(UTC_DATE() - INTERVAL 8 DAY, '18:00:00'), 'BILLED', 'PERSONAL_CARE', 34.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 8 DAY, '18:05:00'), TIMESTAMP(UTC_DATE() - INTERVAL 8 DAY, '19:07:00'),
 'Covered for Marcus. Patient needed extra time on the stairs; no falls.',
 'Eleanor Whitfield',
 'Asked whether her regular caregiver would be back next week.'),

(13, 3, 1, TIMESTAMP(UTC_DATE() - INTERVAL 13 DAY, '13:00:00'), 'BILLED', 'PERSONAL_CARE', 52.50,
 TIMESTAMP(UTC_DATE() - INTERVAL 13 DAY, '13:01:00'), TIMESTAMP(UTC_DATE() - INTERVAL 13 DAY, '14:33:00'),
 'Walked to the corner and back. Good spirits, no shortness of breath.',
 'Rosa Delgado', NULL),

(14, 4, 3, TIMESTAMP(UTC_DATE() - INTERVAL 9 DAY, '15:30:00'), 'BILLED', 'PERSONAL_CARE', 56.00,
 TIMESTAMP(UTC_DATE() - INTERVAL 9 DAY, '15:31:00'), TIMESTAMP(UTC_DATE() - INTERVAL 9 DAY, '17:02:00'),
 'Full physical therapy set completed. Reports stiffness in the morning only.',
 'Harold Brennan', NULL);
