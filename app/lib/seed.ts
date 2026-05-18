import { db } from "./contacts.ts";

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
    let count = await db.contacts.count;
    if (count > 0) {
        console.log(`Seed skipped: ${count} contact(s) already present.`);
        return;
    }

    for (let contact of SEED_CONTACTS) {
        await db.contacts.create({
            first: contact.first,
            last: contact.last,
            avatar: contact.avatar,
            bsky: contact.bsky,
            notes: "",
        });
    }

    console.log(`Seeded ${SEED_CONTACTS.length} contact(s).`);
}
