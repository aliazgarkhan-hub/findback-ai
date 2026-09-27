CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lostReportId` int NOT NULL,
	`foundReportId` int NOT NULL,
	`score` int NOT NULL,
	`factors` text NOT NULL,
	`explanation` text NOT NULL,
	`status` enum('possible','contacted','not_match','recovered') NOT NULL DEFAULT 'possible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('lost','found') NOT NULL,
	`itemName` varchar(160) NOT NULL,
	`category` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(180) NOT NULL,
	`eventAt` timestamp NOT NULL,
	`brand` varchar(120),
	`model` varchar(120),
	`color` varchar(80),
	`features` text,
	`identifier` varchar(160),
	`imageUrl` varchar(520) NOT NULL,
	`imageKey` varchar(520) NOT NULL,
	`contactPreference` varchar(32) NOT NULL DEFAULT 'in_app',
	`status` enum('active','matched','recovered','closed') NOT NULL DEFAULT 'active',
	`isDemo` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
