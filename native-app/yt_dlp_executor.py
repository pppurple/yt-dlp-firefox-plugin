#!/usr/bin/env python

import sys
import json
import struct
import subprocess
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(filename='yt-dlp-executor.log', encoding='utf-8', level=logging.DEBUG)

try:
    # Python 3.x version
    # Read a message from stdin and decode it.
    def getMessage():
        rawLength = sys.stdin.buffer.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.buffer.read(messageLength).decode('utf-8')
        print("mes"+message)
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(messageContent):
        # https://docs.python.org/3/library/json.html#basic-usage
        # To get the most compact JSON representation, you should specify 
        # (',', ':') to eliminate whitespace.
        # We want the most compact representation because the browser rejects
        # messages that exceed 1 MB.
        encodedContent = json.dumps(messageContent, separators=(',', ':')).encode('utf-8')
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(encodedMessage):
        sys.stdout.buffer.write(encodedMessage['length'])
        sys.stdout.buffer.write(encodedMessage['content'])
        sys.stdout.buffer.flush()

    while True:
        receivedMessage = getMessage()
        baseYtDir = '<base_dir_where_yt-dlp.exe_id_located>'
        downloadDir = '<any_dir>'
        if receivedMessage["type"] == "list":
            #sendMessage(encodeMessage(receivedMessage))
            # + : reverse sort
            # --format-sort-force: The fields hasvid and ie_pref are always given highest priority in sorting, irrespective of the user-defined order. This behaviour can be changed by using --format-sort-force
            #command = (baseYtDir + '\\yt-dlp.exe ' + receivedMessage["url"] + ' -F '
            #    + '--format-sort-force '
            #    + '-S +hasvid,+ie_pref,+quality,+res,+fps'
            #    )
            command = [baseYtDir + '\\yt-dlp.exe', 
                       receivedMessage["url"], '-F', '--format-sort-force',
                       '-S', '+hasvid,+ie_pref,+quality,+res,+fps']
            logger.info('command:' + subprocess.list2cmdline(command))
            #res = subprocess.run(command, stdout=subprocess.PIPE, shell=True, encoding="shift-jis")
            res = subprocess.run(subprocess.list2cmdline(command), stdout=subprocess.PIPE, shell=True, encoding="shift-jis")
            r = {"res": res.stdout, "type":"list"}
            sendMessage(encodeMessage(r))
            #sendMessage(encodeMessage(res.stdout))
        if receivedMessage["type"] == "download":
            #sendMessage(encodeMessage(receivedMessage))
            url = receivedMessage["url"]
            configFile = "yt-dlp-common.conf"
            if "tver.jp" in url:
                configFile = "yt-dlp-tver.conf"
            if "youtube.com" in url:
                configFile = "yt-dlp-youtube.conf"

            formatCode = receivedMessage["formatCode"]
            logger.info('formtCode:' + formatCode)
            if formatCode == "best":
                #format = " -f bestvideo*+bestaudio/best"
                format = []
            else:
                #format = ' -f ' + formatCode
                format = ["-f", formatCode] 
            log_message = ",".join(format)
            logger.info('format: %s', log_message)

            #command = (baseYtDir + '\\yt-dlp.exe ' + url
            #            + format
            #            + ' --config-location ' + baseYtDir + '\\' + configFile
            #            + ' -P ' + downloadDir
            #            )
            command = [baseYtDir + '\\yt-dlp.exe', 
                       url, '--config-location',
                       baseYtDir + '\\' + configFile,
                       '-P', downloadDir] + format
            #logger.info('command:' + command)
            #res = subprocess.run(command, stdout=subprocess.PIPE, shell=True, encoding="shift-jis")
            logger.info('command:' + subprocess.list2cmdline(command))
            res = subprocess.run(subprocess.list2cmdline(command), stdout=subprocess.PIPE, shell=True, encoding="shift-jis")
            r = {"res": res.stdout, "type":"download"}
            sendMessage(encodeMessage(r))
            #sendMessage(encodeMessage(res.stdout))
        #if receivedMessage == "ping":
            #sendMessage(encodeMessage(receivedMessage))
            #res = subprocess.run("echo %date%", stdout=subprocess.PIPE, shell=True, encoding="shift-jis")
            #sendMessage(encodeMessage(res.stdout))
except AttributeError:
    # Python 2.x version (if sys.stdin.buffer is not defined)
    # Read a message from stdin and decode it.
    def getMessage():
        rawLength = sys.stdin.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.read(messageLength)
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(messageContent):
        # https://docs.python.org/3/library/json.html#basic-usage
        # To get the most compact JSON representation, you should specify 
        # (',', ':') to eliminate whitespace.
        # We want the most compact representation because the browser rejects
        # messages that exceed 1 MB.
        encodedContent = json.dumps(messageContent, separators=(',', ':'))
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(encodedMessage):
        sys.stdout.write(encodedMessage['length'])
        sys.stdout.write(encodedMessage['content'])
        sys.stdout.flush()

    while True:
        receivedMessage = getMessage()
        if receivedMessage == "ping":
            sendMessage(encodeMessage("pong2"))
except Exception as e:
    logging.error("An error occurred: %s", e)
