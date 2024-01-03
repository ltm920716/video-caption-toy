import redis
import os


"""
### redis-server
- macos
  ```
  brew install redis
  services start redis
  ```
- linux
  ```
  apt update
  apt install redis-server
  service redis-server start
  ```
```
redis-cli
# 启用 RDB 持久化，保存条件为在900秒内至少1个 key 被修改
CONFIG SET save "900 1"
# 将持久化文件名设置为 my_dump.rdb
CONFIG SET dbfilename "my_dump.rdb"
```
"""

class RedisOperate:
    def __init__(self, snapshot_filename="my_dump.rdb"):
        self.redis = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
        self.load_from_snapshot(snapshot_filename)

    def load_from_snapshot(self, snapshot_filename):
        # 检查快照文件是否存在
        if os.path.exists(snapshot_filename):
            # 如果存在，从快照文件加载数据到 Redis
            print(f"从快照文件 {snapshot_filename} 中加载数据")
            self.redis.config_set('dbfilename', snapshot_filename)
            self.redis.config_rewrite()  # 更新配置
            self.redis.bgrewriteaof()  # 异步保存快照
        else:
            print("快照文件不存在")

    def add_user(self, user_id, username):
        self.redis.hset('users', user_id, username)

    def get_username(self, user_id):
        return self.redis.hget('users', user_id)

    def record_video_processing(self, video_id, status):
        self.redis.hset('video_processing', video_id, status)

    def get_video_status(self, video_id):
        return self.redis.hget('video_processing', video_id)
    
