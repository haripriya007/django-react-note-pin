import PropTypes from "prop-types";
import "../styles/Note.css"

function Note({ note, onDelete, onTogglePin, isPinning }) {
    const isPinned = Boolean(note.is_pinned)
    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })

    return (
        <div className={`note-card${isPinned ? " note-card-pinned" : ""}`}>
            <div className="note-header">
                <h3 className="note-title">{note.title}</h3>
                <div className="note-actions">
                    <button
                        aria-label={isPinning ? "Updating pin status" : isPinned ? "Unpin note" : "Pin note"}
                        aria-pressed={isPinned}
                        className="pin-button"
                        disabled={isPinning}
                        onClick={() => onTogglePin(note)}
                        type="button"
                    >
                        {isPinning ? "Updating pin..." : isPinned ? "Unpin note" : "Pin note"}
                    </button>
                    <button
                        aria-label="Delete note"
                        className="delete-button"
                        disabled={isPinning}
                        onClick={() => onDelete(note.id)}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="note-content">
                <p>{note.content}</p>
            </div>
            <div className="note-footer">
                {isPinned && <span className="pinned-badge">Pinned</span>}
                <span className="note-date">{formattedDate}</span>
            </div>
        </div>
    );
}

Note.propTypes = {
    isPinning: PropTypes.bool.isRequired,
    note: PropTypes.shape({
        content: PropTypes.string.isRequired,
        created_at: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
        is_pinned: PropTypes.bool,
        title: PropTypes.string.isRequired,
    }).isRequired,
    onDelete: PropTypes.func.isRequired,
    onTogglePin: PropTypes.func.isRequired,
};

export default Note
