import './styles.module.scss';
import Box from 'components/Box';
import Row from 'components/Row';
import Page from 'components/Page';
import type { ServerResponse } from 'http';
import BoxFooter from 'components/Box/BoxFooter';
import Button from 'components/Button';
import Router from 'next/router';
import BoxSection from 'components/Box/BoxSection';
import type { integer } from 'lib/types';
import getRandomImageFilename from 'lib/server/getRandomImageFilename';

const goBack = () => {
	const { asPath } = Router;

	Router.back();

	if (Router.asPath === asPath) {
		Router.push('/');
	}
};

export type ErrorPageProps = {
	statusCode: integer,
	imageFilename?: never
} | {
	statusCode: 403,
	imageFilename: string
};

const ErrorPage = ({ statusCode, imageFilename }: ErrorPageProps) => (
	<Page withFlashyTitle heading={`Error ${statusCode}`}>
		<Box id="error-box">
			{statusCode === 403 && (
				<BoxSection>
					<Row>
						<img
							src={`/images/403/${imageFilename!}`}
							alt="Artwork for Error 403"
							title={`Artist: ${imageFilename!.slice(0, imageFilename!.indexOf('.'))}`}
						/>
					</Row>
					<Row>You don't have permission to access this page.</Row>
				</BoxSection>
			)}
			<BoxFooter>
				<Button onClick={goBack}>
					Go Back
				</Button>
			</BoxFooter>
		</Box>
	</Page>
);

// @server-only {
// Pass the status code from Next to `ErrorPage`'s props.
ErrorPage.getInitialProps = async ({ res, error }: {
	res?: ServerResponse,
	error?: any
}): Promise<ErrorPageProps> => {
	const statusCode: integer = res?.statusCode || error?.statusCode || 404;

	return statusCode === 403 ? {
		statusCode: 403,
		imageFilename: await getRandomImageFilename('public/images/403')
	} : {
		statusCode
	};
};
// @server-only }

export default ErrorPage;