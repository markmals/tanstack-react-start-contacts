import { api } from "#convex/_generated/api.js";

import { createConvexHttpClient } from "./convex.ts";

const SEED_CONTACTS = [
    {
        first: "Dominik",
        last: "Dorfmeister",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:3nqrhu5mthmias3zc4a2ovzj/bafkreiepp42i2vf4gvjzqleae6vq3niuv4wergy6nobb3mzkjkk7e6tiwm",
        bsky: "tkdodo.eu",
    },
    {
        first: "Kevin",
        last: "Van Cott",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:ptot3cvayryrzehik2km4edj/bafkreihuyiehkhdrwhz4uwrbo6xo3xbverpuvalzeigja5gbn2zndcq3da",
        bsky: "kevinvancott.dev",
    },
    {
        first: "Nicolas",
        last: "Beaussart",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:opw3iapscc55nlgrx6q2yjah/bafkreiaj72657msogojjdk4wr76fe3umimydon3pzzrquuj7opcftntrqa",
        bsky: "beaussan.io",
    },
    {
        first: "Birk",
        last: "Skyum",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:4prtsutlejsvj243rrrgqbhb/bafkreiawpzppyhpju6p53bmqateyo27yndurx62iau5afjxvsu6kp2kb3i",
        bsky: "bskyum.bsky.social",
    },
    {
        first: "Jonghyeon",
        last: "Ko",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:dm2dsi6uotul5jbhsp2xxpcw/bafkreihbwe2y5yfomhwywqijfvoejqdcqinryucsqpna56o75gb76c542q",
        bsky: "manudeli.bsky.social",
    },
];

export async function seedDatabase() {
    let convex = createConvexHttpClient();
    let inserted = await convex.mutation(api.contacts.seed, {
        contacts: SEED_CONTACTS.map(c => ({ ...c, notes: "" })),
    });

    if (inserted === 0) {
        console.log("Seed skipped: contacts already present.");
    } else {
        console.log(`Seeded ${inserted} contact(s).`);
    }
}
