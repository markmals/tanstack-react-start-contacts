CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first` text NOT NULL,
	`last` text NOT NULL,
	`avatar` text,
	`bsky` text NOT NULL,
	`notes` text NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
