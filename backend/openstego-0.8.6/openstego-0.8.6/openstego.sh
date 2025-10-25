#!/bin/bash

# OpenStego - Steganography utility to hide messages into cover files
# Copyright 2007-2023 (c) Samir Vaidya (mailto:syvaidya@gmail.com)

JAVA_OPTS=-Xmx1024m

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

java ${JAVA_OPTS} -jar ${DIR}/lib/openstego.jar $*
