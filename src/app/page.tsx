import { Button } from '~/components/ui/button';
import mongoClient from '~/lib/mongodb';

export default async function Index() {
  const isConnected = await testDatabaseConnection();

  return (
    <div>
      <p>Home</p>
      <p>{isConnected ? '' : 'not'} connected</p>
      <Button>test button</Button>
    </div>
  );
}

export async function testDatabaseConnection() {
  try {
    await mongoClient.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!'); // because this is a server action, the console.log will be outputted to your terminal not in the browser
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
