import validate from './index.validate';
import type { APIHandler } from 'lib/server/api';
import type { ServerComment } from 'lib/server/comments';
import { getClientComment } from 'lib/server/comments';
import type { ServerStoryPage } from 'lib/server/stories';
import stories, { getStoryByUnsafeID } from 'lib/server/stories';
import { authenticate } from 'lib/server/auth';
import type { ClientComment } from 'lib/client/comments';
import { Perm } from 'lib/client/perms';
import { StoryPrivacy } from 'lib/client/stories';
import { flatten } from 'lib/server/db';

/** The keys of all `ClientComment` properties which the client should be able to `PATCH` into their `ServerComment`. */
type WritableCommentKey = 'content';

const Handler: APIHandler<{
	query: {
		storyID: string,
		pageID: string,
		commentID: string
	}
} & (
	{
		method: 'GET'
	} | {
		method: 'DELETE'
	} | {
		method: 'PATCH',
		body: Pick<ClientComment, WritableCommentKey>
	}
), {
	method: 'GET',
	body: ClientComment
} | {
	method: 'DELETE'
} | {
	method: 'PATCH',
	body: ClientComment
}> = async (req, res) => {
	await validate(req, res);

	const story = await getStoryByUnsafeID(req.query.storyID, res);

	const { user } = await authenticate(req, res);

	if (story.privacy === StoryPrivacy.Private && !(
		user && (
			story.owner.equals(user._id)
			|| story.editors.some(userID => userID.equals(user._id))
			|| user.perms & Perm.sudoRead
		)
	)) {
		res.status(403).send({
			message: 'You do not have permission to access the specified adventure.'
		});
		return;
	}

	if (!story.allowComments) {
		res.status(403).send({
			message: 'Comments are disabled on the specified adventure.'
		});
		return;
	}

	const page = story.pages[+req.query.pageID] as ServerStoryPage | undefined;

	if (!page) {
		res.status(404).send({
			message: 'No page was found with the specified ID.'
		});
		return;
	}

	const comment = page.comments.find(({ id }) => id.toString() === req.query.commentID);

	if (!comment) {
		res.status(404).send({
			message: 'No comment was found with the specified ID.'
		});
		return;
	}

	if (req.method === 'GET') {
		res.send(getClientComment(comment, page.id, user));
		return;
	}

	if (req.method === 'DELETE') {
		if (!(
			user && (
				comment.author.equals(user._id)
				|| story.owner.equals(user._id)
				|| story.editors.some(userID => userID.equals(user._id))
				|| user.perms & Perm.sudoDelete
			)
		)) {
			res.status(403).send({
				message: 'You do not have permission to delete the specified comment.'
			});
			return;
		}

		await stories.updateOne({
			_id: story._id
		}, {
			$pull: {
				[`pages.${page.id}.comments`]: {
					id: comment.id
				}
			}
		});

		res.end();
		return;
	}

	// If this point is reached, `req.method === 'PATCH'`.

	if (!(
		user && (
			comment.author.equals(user._id)
			|| user.perms & Perm.sudoWrite
		)
	)) {
		res.status(403).send({
			message: 'You do not have permission to edit the specified comment.'
		});
		return;
	}

	const commentMerge: Partial<ServerComment> = {
		...req.body,
		edited: new Date()
	};

	Object.assign(comment, commentMerge);

	await stories.updateOne({
		_id: story._id,
		[`pages.${page.id}.comments.id`]: comment.id
	}, {
		$set: flatten(commentMerge, `pages.${page.id}.comments.$.`)
	});

	res.send(getClientComment(comment, page.id, user));
};

export default Handler;