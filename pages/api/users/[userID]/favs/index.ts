import validate from './index.validate';
import type { APIHandler } from 'modules/server/api';
import { Perm } from 'modules/client/perms';
import { permToGetUserInAPI } from 'modules/server/perms';
import type { UserDocument } from 'modules/server/users';
import users from 'modules/server/users';
import type { StoryID } from 'modules/server/stories';

const Handler: APIHandler<{
	query: {
		userID: string
	},
	method: 'POST',
	body: {
		storyID: StoryID
	}
}, {
	method: 'POST',
	body: UserDocument['favs']
}> = async (req, res) => {
	await validate(req, res);

	const user = await permToGetUserInAPI(req, res, Perm.sudoWrite);

	if (user.favs.some(fav => fav === req.body.storyID)) {
		res.status(422).send({
			message: 'That adventure is already in your favorites.'
		});
		return;
	}

	await users.updateOne({
		_id: user._id
	}, {
		$push: {
			favs: req.body.storyID
		}
	});

	res.send([...user.favs, req.body.storyID]);
};

export default Handler;