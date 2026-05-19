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
    {
        first: "Brenley",
        last: "Dueck",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:454xidniylzw6pgxpum7a4vl/bafkreibbiewomwhijv46rpyg26qdvvbkqjfppain2izz3rttog75rlxv7m",
        bsky: "brenelz.com",
    },
    {
        first: "Tanner",
        last: "Linsley",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:bom2qoe5vtdphdgefm2ut46t/bafkreib3scugy5gts6rx73ba2rhfezdkrzj2lgl5bk43fbnsxrzuua4exi",
        bsky: "tannerlinsley.com",
    },
    {
        first: "Jack",
        last: "Herrington",
        avatar: "https://cdn.bsky.app/img/avatar/plain/did:plc:unxvdkbe5zsvfo4x27lwmogd/bafkreiebujk6uoxikeijsebugfbblzrsjr674i7l2t2mhkap7hhit6qa7i",
        bsky: "jherr.dev",
    },
    {
        first: "Alem",
        last: "Tuzlak",
        avatar: "https://avatars.githubusercontent.com/u/18480956?v=4",
        bsky: "",
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
