export default function MemberPicker({ members, selectedIds, onToggle }) {
  return (
    <div className="picker">
      <h4>Members</h4>
      {members.map((member) => {
        const on = selectedIds.includes(member.id);
        return (
          <button
            key={member.id}
            className={`picker__member${on ? ' picker__member--on' : ''}`}
            onClick={() => onToggle(member.id, !on)}
          >
            <span className="avatar" style={{ background: member.avatar_color }}>
              {member.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            {member.name}
            {on && <span className="picker__check">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
