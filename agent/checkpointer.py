from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

checkpointer = AsyncSqliteSaver.from_conn_string(
    "/app/workspace/checkpoints/checkpoints.sqlite")
