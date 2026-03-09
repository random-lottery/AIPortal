import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Test log from Netlify Function!');
  console.log('Event received:', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Log test successful!' }),
  };
};

export { handler };