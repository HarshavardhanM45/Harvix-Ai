import json
from flask import Blueprint, request, jsonify
from db import get_connection

progress_bp = Blueprint('progress', __name__, url_prefix='/api/progress')


@progress_bp.route('/<int:user_id>', methods=['GET'])
def get_all_progress(user_id):
    """Return all topic progress rows for a given user."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT topic_id, completed_tasks, is_completed, updated_at
            FROM module_progress
            WHERE user_id = %s
            """,
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = {}
        for topic_id, completed_tasks, is_completed, updated_at in rows:
            result[topic_id] = {
                "completedTasks": completed_tasks,   # list of booleans
                "isCompleted":    is_completed
            }
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@progress_bp.route('/<int:user_id>/<topic_id>', methods=['POST'])
def save_progress(user_id, topic_id):
    """Upsert progress for a single topic."""
    data = request.get_json()
    completed_tasks = data.get('completedTasks', [])
    is_completed    = data.get('isCompleted', False)

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO module_progress (user_id, topic_id, completed_tasks, is_completed, updated_at)
            VALUES (%s, %s, %s::jsonb, %s, NOW())
            ON CONFLICT (user_id, topic_id) DO UPDATE
                SET completed_tasks = EXCLUDED.completed_tasks,
                    is_completed    = EXCLUDED.is_completed,
                    updated_at      = NOW()
            RETURNING id
            """,
            (user_id, topic_id, json.dumps(completed_tasks), is_completed)
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Progress saved."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@progress_bp.route('/<int:user_id>/<topic_id>', methods=['DELETE'])
def reset_progress(user_id, topic_id):
    """Delete a topic's progress row (hard reset)."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM module_progress WHERE user_id = %s AND topic_id = %s",
            (user_id, topic_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Progress reset."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
