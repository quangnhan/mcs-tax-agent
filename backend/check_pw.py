from werkzeug.security import check_password_hash

hash = "scrypt:32768:8:1$VUgz94B3V4eZx8Xr$67018363fc60925b8f10b842443a7f3b57e69209f1fac3cd3a04e1381186463bf9abd03a88c47b8cbeb2b7aede4cd038219dbf7c528867004bc46aa1968eba0e"
print(check_password_hash(hash, "admin@123"))
