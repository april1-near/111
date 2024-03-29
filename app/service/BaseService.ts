/* eslint-disable jsdoc/require-param-type */
import { Service } from 'egg'
import { v4 as uuidv4 } from 'uuid'

import { h, v, f, Cookie } from '../utils/secret'

class BaseService extends Service {
  _headers (opts) {
    return {
      Cookie,
      Secret: h(Object(v)(f), f),
      Host: 'www.kuwo.cn',
      Referer: 'http://www.kuwo.cn/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
      ...opts,
    }
  }

  timeoutCount = 0

  async commonRequest (url, options) {
    const opts = {
      method: 'GET',
      dataType: 'json',
      timeout: 60000,
      ...options,
      headers: this._headers(options?.headers),
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    return handleGetData(_this, url, opts)
  }
}

module.exports = BaseService
/**
 * @param _this
 * @param url
 * @param opts
 */
export function handleGetData (_this, url, opts) {
  const reqId = uuidv4()
  return _this.ctx.curl(`${url}&reqId=${reqId}`, opts).then(res => {
    _this.logger.info({
      req: Object.assign({}, opts, { ctx: undefined }),
      url,
      reqId,
      status: res.status,
      res: JSON.stringify(res.data),
    })
    _this.timeoutCount = 0

    return res.data
  }).catch(e => {
    _this.logger.info({
      req: Object.assign({}, opts, { ctx: undefined }),
      url,
      reqId,
      error: e,
      res: null,
    })
    // 失败自动重试
    if (_this.timeoutCount <= 2) {
      _this.timeoutCount++
      return handleGetData(_this, url, opts)
    }

    _this.timeoutCount = 0

    throw e
  })
}
