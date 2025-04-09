import { Button } from '~/components/ui/button';
import { addNewProduct, removeProduct } from '~/lib/actions';
import mongoClient from '~/lib/mongodb/client';

export default async function Index() {
  const isConnected = await testDatabaseConnection();
  const count = await mongoClient.db('next-shop').collection('products').countDocuments();
  const products = await mongoClient.db('next-shop').collection('products').find().toArray();
  return (
    <div className="p-4">
      <p>Home</p>
      <p>{isConnected ? '' : 'not'} connected to DB</p>
      <p>Count: {count}</p>
      <Button onClick={addNewProduct.bind(null, count)}>add</Button>
      <Button onClick={removeProduct}>remove</Button>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
}

async function testDatabaseConnection() {
  try {
    await mongoClient.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!'); // because this is a server action, the console.log will be outputted to your terminal not in the browser
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
