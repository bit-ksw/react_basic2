import MsgList from '../components/MsgList'
// import fetcher from '../fetcher'
import { fetcher } from '../queryClient'
import { GET_MESSAGES } from '../graphql/message'
import { GET_USERS } from '../graphql/user'

const Home = ({ smsgs, users }) => {
  return (
    <MsgList smsgs={smsgs} users={users} />
  )
}

export const getServerSideProps = async () => {
  // const smsgs = await fetcher('get', '/messages')

  const { messages: smsgs } = await fetcher(GET_MESSAGES)
  // console.log("66666 ==" + JSON.stringify(smsgs));

  // const users = await fetcher('get', '/users')
  const { users } = await fetcher(GET_USERS)

  console.log("777 ==" + users);

  console.log({ smsgs, users });

  return {
    props: { smsgs, users }
  }
}

export default Home;
