import './styles.module.scss';
import Page from 'components/Page';
import type { PublicUser } from 'lib/client/users';
import { useUser } from 'lib/client/users';
import { getUserByUnsafeID, getPublicUser } from 'lib/server/users';
import { withErrorPage } from 'lib/client/errors';
import { withStatusCode } from 'lib/server/errors';
import Box from 'components/Box';
import BoxSection from 'components/Box/BoxSection';
import Link from 'components/Link';
import Row from 'components/Row';
import type { PublicStory } from 'lib/client/stories';
import List from 'components/List';
import StoryListing from 'components/StoryListing';
import { Perm } from 'lib/client/perms';
import type { integer } from 'lib/types';
import Button from 'components/Button';
import getRandomImageFilename from 'lib/server/getRandomImageFilename';
import findStoriesAsUser from 'lib/server/findStoriesAsUser';

type ServerSideProps = {
	publicUser: PublicUser,
	favsPublic: boolean,
	publicStories: PublicStory[],
	imageFilename?: string
} | {
	statusCode: integer
};

const Component = withErrorPage<ServerSideProps>(({ publicUser, favsPublic, publicStories, imageFilename }) => {
	const user = useUser();

	return (
		<Page withFlashyTitle heading="Favorite Adventures">
			<Box>
				<BoxSection
					id="favs-section"
					heading={`${publicUser.name}'s Favorites`}
				>
					<Row>
						<Button
							className="small"
							href={`/user/${publicUser.id}`}
						>
							Back to Profile
						</Button>
					</Row>
					{!favsPublic && (
						<Row>
							<span id="favs-public-tip">
								Only you can see your favorites. If you want others to be able to see, enable public favorites in <Link href={`/user/${publicUser.id}/edit`}>your profile settings</Link>.
							</span>
						</Row>
					)}
					{publicStories.length ? (
						<Row>
							<List listing={StoryListing}>
								{publicStories}
							</List>
						</Row>
					) : (
						<>
							<Row>
								<img
									src={`/images/no-favs/${imageFilename!}`}
									alt="Artwork for No Favorites"
									title={`Artist: ${imageFilename!.slice(0, imageFilename!.indexOf('.'))}`}
								/>
							</Row>
							<Row>
								{(publicUser.id === user?.id
									? 'You have no favorite adventures.'
									: 'This user has no favorite adventures.'
								)}
							</Row>
						</>
					)}
				</BoxSection>
			</Box>
		</Page>
	);
});

export default Component;

export const getServerSideProps = withStatusCode<ServerSideProps>(async ({ req, params }) => {
	const userFromParams = await getUserByUnsafeID(params.userID);

	if (!userFromParams) {
		return { props: { statusCode: 404 } };
	}

	const canSudoReadUserFromParams = !!(
		req.user && (
			req.user._id.equals(userFromParams._id)
			|| req.user.perms & Perm.sudoRead
		)
	);

	if (!(userFromParams.settings.favsPublic || canSudoReadUserFromParams)) {
		return { props: { statusCode: 403 } };
	}

	const publicStories = await findStoriesAsUser(req.user, canSudoReadUserFromParams, {
		_id: { $in: userFromParams.favs }
	}).toArray();

	return {
		props: {
			publicUser: getPublicUser(userFromParams),
			favsPublic: userFromParams.settings.favsPublic,
			publicStories,
			...publicStories.length === 0 && {
				imageFilename: await getRandomImageFilename('public/images/no-favs')
			}
		}
	};
});