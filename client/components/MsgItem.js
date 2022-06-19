import MsgInput from './MsgInput'

const MsgItem = ({id, text, userId, timestamp, onDelete, startEdit, isEditing, onUpdate, myId, user}) => {
  return (
    <li className="messages__item">
      <h3>
        <sub>
          id: {id}<br />
          userId: {userId}<br />
          {/* userId: {user.nickname}<br /> */}
          text: {text}<br />
          timestamp: {timestamp}
        </sub>
      </h3>
      {
        isEditing ? (
          <>
            <div>id: {id}</div>
            <MsgInput mutate={onUpdate} text={text} id={id}/>
          </>
        ) : null
      }
      {myId === userId && (
        <div className="message__buttons">
          <button onClick={startEdit}>수정</button>
          <button onClick={onDelete}>삭제</button>
        </div>
      )}
    </li>

  )
}

export default MsgItem
