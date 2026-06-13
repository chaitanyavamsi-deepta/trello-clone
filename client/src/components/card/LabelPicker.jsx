export default function LabelPicker({ labels, selectedIds, onToggle }) {
  return (
    <div className="picker">
      <h4>Labels</h4>
      {labels.map((label) => {
        const on = selectedIds.includes(label.id);
        return (
          <button
            key={label.id}
            className="picker__label"
            style={{ background: label.color }}
            onClick={() => onToggle(label.id, !on)}
          >
            {label.name || ' '}
            {on && <span className="picker__check">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
