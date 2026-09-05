// Mock patient data. Components NEVER import this file directly;
// all access goes through src/services/patientService.js.
//
// The patient was the last domain noun without a record of its own: visits
// carried a patientName string and nothing else, so there was nowhere to put
// a fact that belongs to the person rather than to one visit.
//
// standingConcerns is exactly that kind of fact: what this patient needs help
// with in general, true across every visit. It is deliberately NOT the same
// field as a visit's patientConcern, which is what the patient raised during
// that one visit. Same words, different lifetimes, so different homes.
//
// address is where care happens, which is why it belongs to the patient and
// not the visit, and it is what a real geofenced check-in would compare a
// captured location against.
export const patients = [
    {
        id: 1,
        name: "Eleanor Whitfield",
        phone: "215-555-0231",
        address: "1642 S Broad St, Philadelphia, PA 19145",
        standingConcerns: "Unsteady on stairs after dark. Prefers help with bathing earlier in the day."
    },
    {
        id: 2,
        name: "Samuel Okafor",
        phone: "215-555-0244",
        address: "5310 Chestnut St, Philadelphia, PA 19139",
        standingConcerns: "Appetite is inconsistent; meals need encouragement. Reminders for evening medication."
    },
    {
        id: 3,
        name: "Rosa Delgado",
        phone: "215-555-0198",
        address: "2708 N 5th St, Philadelphia, PA 19133",
        standingConcerns: "Wants to keep walking daily while she can. Spanish is her first language."
    },
    {
        id: 4,
        name: "Harold Brennan",
        phone: "215-555-0176",
        address: "812 Fitzwater St, Philadelphia, PA 19147",
        standingConcerns: "Knee replacement recovery. Physical therapy set is the priority every visit."
    },
    {
        id: 5,
        name: "Miriam Katz",
        phone: "215-555-0159",
        address: "7401 Old York Rd, Elkins Park, PA 19027",
        standingConcerns: "Lives alone and values the company. Hard of hearing on the left side."
    },
    {
        id: 6,
        name: "George Antonelli",
        phone: "215-555-0287",
        address: "1919 S 10th St, Philadelphia, PA 19148",
        standingConcerns: "Low vision. Labels and paperwork need reading aloud."
    },
    {
        id: 7,
        name: "Pearl Jackson",
        phone: "215-555-0134",
        address: "4522 Baltimore Ave, Philadelphia, PA 19143",
        standingConcerns: "Daughter handles paperwork and often signs. Prefers a familiar caregiver."
    },
    {
        id: 8,
        name: "Dorothy Chen",
        phone: "215-555-0265",
        address: "1030 Race St, Philadelphia, PA 19107",
        standingConcerns: "Wound care on the left forearm per care plan. Dressing changed each visit."
    },
    {
        id: 9,
        name: "Walter Osei",
        phone: "215-555-0212",
        address: "6218 Chew Ave, Philadelphia, PA 19138",
        standingConcerns: "Diabetic. Watches blood sugar closely and wants meals kept on schedule."
    },
    {
        id: 10,
        name: "Agnes Romano",
        phone: "215-555-0221",
        address: "2436 E Cumberland St, Philadelphia, PA 19125",
        standingConcerns: "Medication cabinet is disorganised and labels are too small for her to read."
    }
];
