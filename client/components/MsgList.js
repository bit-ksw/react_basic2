import { useEffect, useState, useRef } from "react"
import { useRouter } from 'next/router'
import { useQueryClient, useMutation, useQuery, useInfiniteQuery } from 'react-query'
import MsgItem from "./MsgItem"
import MsgInput from "./MsgInput"
// import fetcher from "../fetcher"
import { fetcher, QueryKeys } from "../queryClient"
import { GET_MESSAGES, CREATE_MESSAGE, UPDATE_MESSAGE, DELETE_MESSAGE } from "../graphql/message"
import useInfiniteScroll from "../hooks/useInfiniteScroll"

// const userIds = ['kim', 'lee']
// const getRandomUserId = () => userIds[Math.round(Math.random())]

// const originalMsgs = Array(50).fill(0).map((_, i) => ({
//   id: i + 1,
//   userId: getRandomUserId(),
//   timestamp: 1234567890123 + (50 - i) * 1000 * 60,
//   text: `${50 - i} mock text`
// }))


const MsgList = ({ smsgs, users }) => {
  const client = useQueryClient()
  const { query } = useRouter()
  // const { query: { userId = '' }} = useRouter()
  const userId = query.userId || query.userid || '';
  const [msgs, setMsgs] = useState(smsgs)
  const [editingId, setEditingId] = useState(null)

  // const [hasNext, setHasNext] = useState(true)
  const fetchMoreEl = useRef(null)
  const intersecting = useInfiniteScroll(fetchMoreEl)

  const { mutate: onCreate } = useMutation(({ text }) => fetcher(CREATE_MESSAGE, { text, userId }), {
    onSuccess: ({ createMessage }) => {
      client.setQueryData(QueryKeys.MESSAGES, old => {
        return {
          messages: [createMessage, ...old.messages]
        }
      })
    }
  })

  const { mutate: onUpdate } = useMutation(({ text, id }) => fetcher(UPDATE_MESSAGE, { text, id, userId }), {
    onSuccess: ({ updateMessage }) => {
      client.setQueryData(QueryKeys.MESSAGES, old => {
        const targetIndex = old.messages.findIndex(msg => msg.id === updateMessage.id)
        if (targetIndex < 0) return old;
        const newMsgs = [...old.messages]
        newMsgs.splice(targetIndex, 1, updateMessage)
        return { messages: newMsgs }
      })
      doneEdit()
    }
  })

  const { mutate: onDelete } = useMutation(id => fetcher(DELETE_MESSAGE, { id, userId }), {
    onSuccess: ({ deleteMessage: deletedId }) => {
      client.setQueryData(QueryKeys.MESSAGES, old => {
        const targetIndex = old.messages.findIndex(msg => msg.id === deletedId)
        if (targetIndex < 0) return old;
        const newMsgs = [...old.messages]
        newMsgs.splice(targetIndex, 1)
        return { messages: newMsgs }
      })
    }
  })


  // const onCreate = async (text) => {

  //   const newMsg = await fetcher('post', '/messages', { text, userId })

  //   if (!newMsg) throw Error('something wrong')

  //   // const newMsg = {
  //   //   id: msgs.length + 1,
  //   //   userId: getRandomUserId(),
  //   //   timestamp: Date.now(),
  //   //   text: `${msgs.length + 1} ${text}`
  //   // }

  //   setMsgs(prev => {
  //     return (
  //       [newMsg, ...prev]
  //     )
  //   })

  // }

  // const onDelete = async id => {
  //   const receviedId = await fetcher('delete', `/messages/${id}`, { params: { userId } })
  //   setMsgs(msgs => {
  //     const targetIndex = msgs.findIndex(msg => msg.id === receviedId + '')
  //     if (targetIndex < 0) return msgs

  //     const newMsgs = [...msgs]

  //     newMsgs.splice(targetIndex, 1)

  //     return newMsgs

  //   })
  // }

  // const onUpdate = async (text, id) => {
  //   const newMsg = await fetcher('put', `/messages/${id}`, { text, userId })
  //   if (!newMsg) throw Error('something wrong')

  //   setMsgs(msgs => {
  //     const targetIndex = msgs.findIndex(m => m.id === id)
  //     if (targetIndex < 0) return msgs;
  //     const newMsgs = [...msgs]

  //     // newMsgs.splice(targetIndex, 1, {
  //     //   ...msgs[targetIndex],
  //     //   text
  //     // })
  //     newMsgs.splice(targetIndex, 1, newMsg)
  //     return newMsgs

  //   })

  //   doneEdit()

  // }


  const doneEdit = () => setEditingId(null)

  const { data, error, isError, fetchNextPage, hasNextPage } = useInfiniteQuery(
    QueryKeys.MESSAGES,
    ({ pageParam = '' }) => fetcher(GET_MESSAGES, { cursor: pageParam }), // stale: 옛것. 미리 받아놓은 정보
    {
      getNextPageParam: ({ messages }) => {
        return messages?.[messages.length - 1]?.id
      }
    }
  )

  useEffect(() => {
    if (!data?.pages) return
    console.log('msgs changed');
    // const data.pages = [{ messages: [...] }, { messages: [...] }] => [...]
    const mergedMsgs = data.pages.flatMap(d => d.messages)
    console.log({ mergedMsgs });
    setMsgs(mergedMsgs)
  }, [data?.pages])


  if (isError) {
    console.error(error);
    return null;
  }

  // const getMessages = async () => {
  //   const newMsgs = await fetcher('get', '/messages', { params: { cursor: msgs[msgs.length - 1]?.id || '' }})
  //   if (newMsgs.length === 0) {
  //     setHasNext(false)
  //     return
  //   }
  //   setMsgs(msgs => [...msgs, ...newMsgs])
  // }

  useEffect(() => {
    if (intersecting && hasNextPage) fetchNextPage()
  }, [intersecting, hasNextPage])

  // console.log({ intersecting, hasNext, msgs })
  // console.log({ data })

  return (
    <>
      {userId && <MsgInput mutate={onCreate}/> }
      <ul className="messages">
        {msgs.map(m => {
          return (
            <MsgItem
              key={m.id}
              {...m}
              onDelete={() => onDelete(m.id)}
              startEdit={() => setEditingId(m.id)}
              isEditing={editingId === m.id}
              onUpdate={onUpdate}
              myId={userId}
              // user={users[m.userId]}
              user={users.find(x => userId === x.userId)}
            />
          )
        })}
      </ul>
      <div ref={fetchMoreEl} />
    </>
  )
}

export default MsgList
