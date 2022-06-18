import { useEffect, useState, useRef } from "react"
import MsgItem from "./MsgItem"
import MsgInput from "./MsgInput"
import fetcher from "../fetcher"
import { useRouter } from 'next/router'
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
  const { query } = useRouter()
  // const { query: { userId = '' }} = useRouter()
  const userId = query.userId || query.userid || '';
  const [msgs, setMsgs] = useState(smsgs)
  const [editingId, setEditingId] = useState(null)
  const [hasNext, setHasNext] = useState(true)
  const fetchMoreEl = useRef(null)
  const intersecting = useInfiniteScroll(fetchMoreEl)

  const onCreate = async (text) => {

    const newMsg = await fetcher('post', '/messages', { text, userId })

    if (!newMsg) throw Error('something wrong')

    // const newMsg = {
    //   id: msgs.length + 1,
    //   userId: getRandomUserId(),
    //   timestamp: Date.now(),
    //   text: `${msgs.length + 1} ${text}`
    // }

    setMsgs(prev => {
      return (
        [newMsg, ...prev]
      )
    })

  }

  const onDelete = async id => {
    const receviedId = await fetcher('delete', `/messages/${id}`, { params: { userId } })
    setMsgs(msgs => {
      const targetIndex = msgs.findIndex(msg => msg.id === receviedId + '')
      if (targetIndex < 0) return msgs

      const newMsgs = [...msgs]

      newMsgs.splice(targetIndex, 1)

      return newMsgs

    })
  }

  const onUpdate = async (text, id) => {
    const newMsg = await fetcher('put', `/messages/${id}`, { text, userId })
    if (!newMsg) throw Error('something wrong')

    setMsgs(msgs => {
      const targetIndex = msgs.findIndex(m => m.id === id)
      if (targetIndex < 0) return msgs;
      const newMsgs = [...msgs]

      // newMsgs.splice(targetIndex, 1, {
      //   ...msgs[targetIndex],
      //   text
      // })
      newMsgs.splice(targetIndex, 1, newMsg)
      return newMsgs

    })

    doneEdit()

  }


  const doneEdit = () => setEditingId(null)

  const getMessages = async () => {
    const newMsgs = await fetcher('get', '/messages', { params: { cursor: msgs[msgs.length - 1]?.id || '' }})
    if (newMsgs.length === 0) {
      setHasNext(false)
      return
    }
    setMsgs(msgs => [...msgs, ...newMsgs])
  }

  useEffect(() => {
    if (intersecting && hasNext) getMessages()
  }, [intersecting])

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
              user={users[m.userId]}
            />
          )
        })}
      </ul>
      <div ref={fetchMoreEl} />
    </>
  )
}

export default MsgList
