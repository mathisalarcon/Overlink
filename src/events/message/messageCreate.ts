import { Client, Collection, Message, User } from "discord.js";
import config from "~/data/config.json";

const baseEarn = config.reputation.message.earnPerMessage;
const ratio = config.reputation.message.earnRatio;
const max = config.reputation.message.maxPerMessage;

export default async function (client: Client, msg: Message) {
	if (msg.author.bot) return;

	if (!msg.inGuild()) return;
	await calculateGlobalReputationEarning(client, msg);
}

async function calculateGlobalReputationEarning(client: Client, msg: Message) {
	let messages = msg.channel.messages.cache.filter(
		(m) =>
			m.createdTimestamp >= Date.now() - 3600000 && // 1 heure
			m.author.id !== msg.author.id &&
			!m.author.bot
	);
	let uniqueAuthors = new Set(messages.map((m) => m.author.id));

	for (let author of uniqueAuthors) {
		if (!client.users.cache.has(author)) await client.users.fetch(author);
		if (!client.db.users.cache.has(author))
			await client.db.users.create(author);
		if (!client.db.users.cache.has(msg.author.id))
			await client.db.users.create(msg.author.id);
		if (
			!client.db.users.cache
				.get(msg.author.id)
				.connections.cache.has(author)
		)
			await client.db.users.cache
				.get(msg.author.id)
				.connections.create(author);
		let earning = await calculateReputationEarning(
			client,
			msg,
			client.users.cache.get(author)
		);
		await client.db.users.cache
			.get(msg.author.id)
			.connections.cache.get(author)
			.interactions.add(earning, "messages");
	}

	if (msg.mentions.users.size > 0) {
		for (let targetUser of msg.mentions.users
			.filter((u) => !u.bot && !uniqueAuthors.has(u.id))
			.values()) {
			if (!client.db.users.cache.has(targetUser.id))
				await client.db.users.create(targetUser.id);
			if (!client.db.users.cache.has(msg.author.id))
				await client.db.users.create(msg.author.id);
			if (
				!client.db.users.cache
					.get(msg.author.id)
					.connections.cache.has(targetUser.id)
			)
				await client.db.users.cache
					.get(msg.author.id)
					.connections.create(targetUser.id);
			const interactionsWithTarget = getInteractionsWithUser(
				client,
				msg,
				targetUser
			);
			const baseEarningsFactor =
				(baseEarn *
					Math.exp(ratio * (interactionsWithTarget.size || 1))) /
				(1 + ratio * interactionsWithTarget.size);
			const connectionWeightFactor =
				1 /
				(1 +
					client.db.users.cache
						.get(msg.author.id)
						.connections.cache.get(targetUser.id).weight);
			const earnings = Math.min(
				max,
				baseEarningsFactor * connectionWeightFactor
			);

			await client.db.users.cache
				.get(msg.author.id)
				.connections.cache.get(targetUser.id)
				.interactions.add(earnings, "mention");
		}
	}
}

async function calculateReputationEarning(
	client: Client,
	msg: Message,
	target: User
) {
	let interactionsWithTarget = getInteractionsWithUser(client, msg, target);
	// Récupère le message le plus ancien et regarde le nombre de personne ayant parlé avec la cible
	let oldestMessage = interactionsWithTarget
		.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
		.first();
	// On récupère les auteurs uniques des messages en retirant les bots et l'auteur du message actuel
	let uniqueAuthors = new Set(
		msg.channel.messages.cache
			.filter(
				(m) =>
					m.createdTimestamp > oldestMessage.createdTimestamp &&
					!m.author.bot &&
					m.author.id !== msg.author.id
			)
			.map((m) => m.author.id)
	);

	let isMentioned = msg.mentions.users.has(target.id); // Est-ce que l'auteur du message actuel mentionne la cible ?
	let isReply = false; // Est-ce que le message actuel est une réponse à un message de la cible ?
	if (msg.reference?.messageId) {
		try {
			var repliedMessage = await msg.channel.messages.fetch(
				msg.reference.messageId
			);
			isReply =
				repliedMessage?.author.id === target.id &&
				!repliedMessage.author.bot;
		} catch {}
	}
	if (target.bot) return 0;
	if (!client.db.users.cache.has(target.id))
		await client.db.users.create(target.id);
	if (
		!client.db.users.cache
			.get(msg.author.id)
			.connections.cache.has(target.id)
	)
		await client.db.users.cache
			.get(msg.author.id)
			.connections.create(target.id);

	const baseEarningsFactor =
		(baseEarn * Math.exp(ratio * interactionsWithTarget.size)) /
		(1 + ratio * interactionsWithTarget.size);
	const connectionWeightFactor =
		1 /
		(1 +
			client.db.users.cache
				.get(msg.author.id)
				.connections.cache.get(target.id).weight);
	const activeUsersFactor = 1 / (1 + 0.1 * uniqueAuthors.size);
	const mentionsFactor = isMentioned || isReply ? 1 / activeUsersFactor : 1;
	const earnings = Math.min(
		max,
		baseEarningsFactor *
			connectionWeightFactor *
			activeUsersFactor *
			mentionsFactor
	);

	return earnings;
}

function getInteractionsWithUser(
	client: Client,
	msg: Message,
	target: User
): Collection<string, Message> {
	const interactions = msg.channel.messages.cache
		.filter((m) => m.author.id === target.id)
		.sort((a, b) => b.createdTimestamp - a.createdTimestamp); // Du plus récent au plus ancien

	let validMessages = new Collection<string, Message>();
	for (let i = 0; i < interactions.size; i++) {
		let interaction = interactions.at(i);
		if ([0, interactions.size].includes(i))
			validMessages.set(interaction.id, interaction); // On ajoute le premier et le dernier message de l'interaction
		// Maintenant, on vérifie le streak de messages valides, donc ceux qui ont été envoyés avec un intervalle de moins de 1 heure entre le messages précédent et le message actuel
		if (
			interactions.at(i - 1).createdTimestamp -
				interaction.createdTimestamp <
			2 * 3600000
		)
			// 2 heures
			validMessages.set(interaction.id, interaction);
		else break;
	}

	return validMessages;
}
