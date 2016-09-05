FROM node:6

# the following commands are needed in your production container
RUN apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb

# on start however, your container must run Xvfb with the following
# commands or similar:
#     Xvfb -ac -screen scrn 1280x2000x24 :9.0 &
#     export DISPLAY=:9.0
#
# For convenience hyperpdf provides a private functionto init those commands,
# which at any time can be deprecated
