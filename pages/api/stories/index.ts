import validate from './index.validate';
import type { APIHandler } from 'modules/server/api';
import type { StoryDocument, StoryID } from 'modules/server/stories';
import stories, { defaultStory, getPrivateStory } from 'modules/server/stories';
import { authenticate } from 'modules/server/auth';
import type { PrivateStory } from 'modules/client/stories';
import { connection } from 'modules/server/db';

const Handler: APIHandler<{
	method: 'POST',
	body: {
		title: StoryDocument['title']
	}
}, {
	method: 'POST',
	body: PrivateStory
}> = async (req, res) => {
	await validate(req, res);

	const { user } = await authenticate(req, res);

	if (!user) {
		res.status(403).send({
			message: 'You must be signed in to create an adventure.'
		});
		return;
	}

	const now = new Date();

	await connection;

	let storyID: StoryID = 1;

	await stories.aggregate!([
		{ $sort: { _id: -1 } },
		{ $limit: 1 }
	]).forEach(story => {
		storyID = story._id + 1;
	});

	const story: StoryDocument = {
		...defaultStory,
		_id: storyID,
		created: now,
		updated: now,
		title: req.body.title,
		owner: user._id,
		editors: [user._id]
	};

	await stories.insertOne(story);

	res.status(201).send(getPrivateStory(story));
};

export default Handler;