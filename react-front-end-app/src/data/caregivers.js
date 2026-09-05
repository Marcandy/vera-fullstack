// Mock caregiver data. Components NEVER import this file directly;
// all access goes through src/services/caregiverService.js.
//
// A DOCUMENT IS A RECORD OF RECEIPT, NOT A STATUS. It used to be
// { name, status }, where "expiring" was asserted by this file: the one
// place in the app that stored a judgment instead of deriving it, and it
// would have been wrong the day after it was written. Status now derives
// from these fields plus the clock, in src/utils/documents.js, the same way
// a visit's missing evidence and the cleared-to-work badge already worked.
//
// id is a real primary key, unique across ALL caregivers rather than within
// one, because documents are their own table. Signing used to be keyed by
// document NAME, which holds only while no two documents share one and no
// name is ever corrected.
//
// issuedAt is when the credential was issued. expiresAt is when it stops
// being valid, stored as the END of that day, because a card that expires on
// the 5th is valid through the 5th. expiresAt: null means it never expires,
// which is how a completed background check behaves: a record that a check
// happened on a date, not a credential that lapses.
//
// A document is RECEIVED when it carries a signature or a file, the two ways
// the office learns it has one. receivedAt is when that happened, whichever
// way it arrived.
//
// submission is a RENEWAL WAITING ON THE OFFICE, or null. A caregiver can send
// in a new card themselves, which is how the real products work, but it does not
// take effect on its own: the agency is what has to produce a valid credential
// at a survey, so a credential that cleared itself would be a credential nobody
// checked. The live fields stay in force until the office accepts, which also
// means renewing a card early cannot invalidate the one still working.
//
// fileName, fileSize and fileType are METADATA ONLY. Nothing here stores the
// bytes, and the UI says so plainly rather than implying a file cabinet that
// does not exist. They are the columns a Spring controller would persist
// beside the blob, so the shape survives the backend even though the storage
// does not exist yet.
import { at } from "./demoDay";

export const caregivers = [
    {
        id: 1,
        name: "Marcus Reed",
        phone: "215-555-0142",
        // Cleared to work with a CPR card inside the renewal window. This is
        // the case the old shape could not express: valid today, needs
        // chasing this month.
        documents: [
            {
                id: 1,
                name: "State ID",
                issuedAt: at(-1100, "00:00"),
                expiresAt: at(600, "23:59"),
                signature: null,
                fileName: "marcus-reed-state-id.jpg",
                fileSize: 412336,
                fileType: "image/jpeg",
                receivedAt: at(-820, "09:12"),
                submission: null
            },
            {
                id: 2,
                name: "Background Check",
                issuedAt: at(-830, "00:00"),
                expiresAt: null,
                signature: "Marcus Reed",
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: at(-830, "14:40"),
                submission: null
            },
            {
                id: 3,
                name: "CPR Certification",
                issuedAt: at(-712, "00:00"),
                expiresAt: at(18, "23:59"),
                signature: null,
                fileName: "marcus-cpr-card.pdf",
                fileSize: 186204,
                fileType: "application/pdf",
                receivedAt: at(-710, "11:05"),
                submission: null
            },
            {
                id: 4,
                name: "TB Test",
                issuedAt: at(-250, "00:00"),
                expiresAt: at(115, "23:59"),
                signature: null,
                fileName: "marcus-tb-results.pdf",
                fileSize: 94118,
                fileType: "application/pdf",
                receivedAt: at(-248, "16:20"),
                submission: null
            }
        ]
    },
    {
        id: 2,
        name: "Dana Alvarez",
        phone: "215-555-0187",
        documents: [
            {
                id: 5,
                name: "State ID",
                issuedAt: at(-600, "00:00"),
                expiresAt: at(900, "23:59"),
                signature: null,
                fileName: "dana-alvarez-state-id.jpg",
                fileSize: 388910,
                fileType: "image/jpeg",
                receivedAt: at(-500, "10:02"),
                submission: null
            },
            {
                id: 6,
                name: "Background Check",
                issuedAt: at(-500, "00:00"),
                expiresAt: null,
                signature: "Dana Alvarez",
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: at(-500, "15:18"),
                submission: null
            },
            {
                id: 7,
                name: "CPR Certification",
                issuedAt: at(-300, "00:00"),
                expiresAt: at(430, "23:59"),
                signature: null,
                fileName: "dana-cpr-card.pdf",
                fileSize: 201774,
                fileType: "application/pdf",
                receivedAt: at(-298, "09:44"),
                submission: null
            },
            {
                id: 8,
                name: "TB Test",
                issuedAt: null,
                expiresAt: null,
                signature: null,
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: null,
                submission: null
            }
        ]
    },
    {
        id: 3,
        name: "Keisha Thompson",
        phone: "215-555-0116",
        // Nothing outstanding and nothing near expiry: the clean roster row.
        documents: [
            {
                id: 9,
                name: "State ID",
                issuedAt: at(-900, "00:00"),
                expiresAt: at(800, "23:59"),
                signature: null,
                fileName: "keisha-thompson-state-id.jpg",
                fileSize: 401552,
                fileType: "image/jpeg",
                receivedAt: at(-700, "08:35"),
                submission: null
            },
            {
                id: 10,
                name: "Background Check",
                issuedAt: at(-700, "00:00"),
                expiresAt: null,
                signature: "Keisha Thompson",
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: at(-700, "13:07"),
                submission: null
            },
            {
                id: 11,
                name: "CPR Certification",
                issuedAt: at(-400, "00:00"),
                expiresAt: at(330, "23:59"),
                signature: null,
                fileName: "keisha-cpr-card.pdf",
                fileSize: 178640,
                fileType: "application/pdf",
                receivedAt: at(-395, "12:29"),
                submission: null
            },
            {
                id: 12,
                name: "TB Test",
                issuedAt: at(-120, "00:00"),
                expiresAt: at(245, "23:59"),
                signature: null,
                fileName: "keisha-tb-results.pdf",
                fileSize: 88402,
                fileType: "application/pdf",
                receivedAt: at(-118, "17:11"),
                submission: null
            }
        ]
    },
    {
        id: 4,
        name: "Luis Rivera",
        phone: "215-555-0163",
        // Three outstanding: the best row for demonstrating signing.
        documents: [
            {
                id: 13,
                name: "State ID",
                issuedAt: at(-200, "00:00"),
                expiresAt: at(1200, "23:59"),
                signature: null,
                fileName: "luis-rivera-state-id.jpg",
                fileSize: 355017,
                fileType: "image/jpeg",
                receivedAt: at(-60, "11:52"),
                submission: null
            },
            {
                id: 14,
                name: "Background Check",
                issuedAt: null,
                expiresAt: null,
                signature: null,
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: null,
                submission: null
            },
            {
                id: 15,
                name: "CPR Certification",
                issuedAt: null,
                expiresAt: null,
                signature: null,
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: null,
                submission: null
            },
            {
                id: 16,
                name: "TB Test",
                issuedAt: null,
                expiresAt: null,
                signature: null,
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: null,
                submission: null
            }
        ]
    },
    {
        id: 5,
        name: "Angela Brooks",
        phone: "215-555-0129",
        // One lapsed and one outstanding. The lapsed CPR card is the case
        // that proves the rule: no button clears it, because signing an
        // expired credential does not renew it. Only a new card does.
        documents: [
            {
                id: 17,
                name: "State ID",
                issuedAt: at(-1000, "00:00"),
                expiresAt: at(400, "23:59"),
                signature: null,
                fileName: "angela-brooks-state-id.jpg",
                fileSize: 397228,
                fileType: "image/jpeg",
                receivedAt: at(-900, "09:03"),
                submission: null
            },
            {
                id: 18,
                name: "Background Check",
                issuedAt: at(-900, "00:00"),
                expiresAt: null,
                signature: "Angela Brooks",
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: at(-900, "16:47"),
                submission: null
            },
            {
                id: 19,
                name: "CPR Certification",
                issuedAt: at(-742, "00:00"),
                expiresAt: at(-12, "23:59"),
                signature: null,
                fileName: "angela-cpr-card.pdf",
                fileSize: 192845,
                fileType: "application/pdf",
                receivedAt: at(-740, "10:16"),
                submission: null
            },
            {
                id: 20,
                name: "TB Test",
                issuedAt: null,
                expiresAt: null,
                signature: null,
                fileName: null,
                fileSize: null,
                fileType: null,
                receivedAt: null,
                submission: null
            }
        ]
    }
];
