import validate from './index.validate';
import type { APIHandler } from 'lib/server/api';
import type { PublicStory } from 'lib/client/stories';
import { getUserByUnsafeID } from 'lib/server/users';
import stories, { getPublicStoriesByEditor, getPublicStory } from 'lib/server/stories';
import { authenticate } from 'lib/server/auth';
import { Perm } from 'lib/client/perms';

const Handler: APIHandler<{
	query: {
		userID: string
	},
	method: 'GET'
}, {
	body: PublicStory[]
}> = async (req, res) => {
	await validate(req, res);

	const editor = await getUserByUnsafeID(req.query.userID, res);

	const { user } = await authenticate(req, res);

	if (user && (
		user._id.equals(editor._id)
		|| user.perms & Perm.sudoRead
	)) {
		res.send(
			await stories.find!({
				$or: [{
					owner: editor._id
				}, {
					editors: editor._id
				}],
				willDelete: { $exists: false }
			}).map(getPublicStory).toArray()
		);
		return;
	}

	res.send(await getPublicStoriesByEditor(editor));
};

export default Handler;