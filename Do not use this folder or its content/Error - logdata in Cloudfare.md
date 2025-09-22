
{
  "source": {
    "level": "error",
    "message": "Sendefeil for lene.zachariassen@gmail.com Error: MailChannels feilet (401): <html>\r\n<head><title>401 Authorization Required</title></head>\r\n<body>\r\n<center><h1>401 Authorization Required</h1></center>\r\n<hr><center>nginx/1.27.1</center>\r\n</body>\r\n</html>\r\n"
  },
  "dataset": "cloudflare-workers",
  "timestamp": "2025-09-20T23:45:12.701Z",
  "$workers": {
    "truncated": false,
    "event": {
      "request": {
        "url": "https://budbringer-dispatch.lene-zachariassen.workers.dev/",
        "method": "POST",
        "path": "/"
      }
    },
    "outcome": "ok",
    "scriptName": "budbringer-dispatch",
    "eventType": "fetch",
    "executionModel": "stateless",
    "scriptVersion": {
      "id": "8623c230-a316-49f9-bba8-620cc0f0e4b2"
    },
    "requestId": "982531efbf3835a6"
  },
  "$metadata": {
    "id": "01K5MR8XFXGQMGTG721RZJ7HQK",
    "requestId": "982531efbf3835a6",
    "trigger": "POST /",
    "service": "budbringer-dispatch",
    "level": "error",
    "error": "Sendefeil for lene.zachariassen@gmail.com Error: MailChannels feilet (401): <html>\r\n<head><title>401 Authorization Required</title></head>\r\n<body>\r\n<center><h1>401 Authorization Required</h1></center>\r\n<hr><center>nginx/1.27.1</center>\r\n</body>\r\n</html>\r\n",
    "message": "Sendefeil for lene.zachariassen@gmail.com Error: MailChannels feilet (401): <html>\r\n<head><title>401 Authorization Required</title></head>\r\n<body>\r\n<center><h1>401 Authorization Required</h1></center>\r\n<hr><center>nginx/1.27.1</center>\r\n</body>\r\n</html>\r\n",
    "account": "fa335b172dc786e7fdfa8fa37461b3ba",
    "type": "cf-worker",
    "fingerprint": "dcd1927502ae002adbc996cc3146f5e4",
    "origin": "fetch",
    "messageTemplate": "Sendefeil for <EMAIL> Error: MailChannels feilet (401): <html>\r\n<head><title>401 Authorization Required</title></head>\r\n<body>\r\n<center><h1>401 Authorization Required</h1></center>\r\n<hr><center>nginx/1.27.1</center>\r\n</body>\r\n</html>"
  },
  "links": []
}