(function (window) {
  const l = 100, // 滑块边长
    r = 20, // 滑块半径
    w = document.body.clientWidth, // canvas宽度
    h = document.body.clientHeight, // canvas高度
    PI = Math.PI
  const L = l + r * 2 // 滑块实际边长
  // console.log(w,h)

  function getRandomNumberByRange(start, end) {
    return Math.round(Math.random() * (end - start) + start)
  }

  function createCanvas(width, height) {
    const canvas = createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  function createImg(onload) {
    const img = createElement('img')
    img.crossOrigin = "Anonymous"
    img.onload = onload
    img.onerror = () => {
      img.src = getRandomImg()
    }
    img.src = getRandomImg()
    return img
  }

  function createElement(tagName) {
    return document.createElement(tagName)
  }

  function addClass(tag, className) {
    tag.classList.add(className)
  }

  function removeClass(tag, className) {
    tag.classList.remove(className)
  }

  function getRandomImg() {
    return getRandomNumberByRange(0, 5) + '.jpeg';
  }

  function draw(ctx, operation, x, y) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + l / 2, y)
    ctx.arc(x + l / 2, y - r + 2, r, 0, 2 * PI)
    ctx.lineTo(x + l / 2, y)
    ctx.lineTo(x + l, y)
    ctx.lineTo(x + l, y + l / 2)
    ctx.arc(x + l + r - 2, y + l / 2, r, 0, 2 * PI)
    ctx.lineTo(x + l, y + l / 2)
    ctx.lineTo(x + l, y + l)
    ctx.lineTo(x, y + l)
    ctx.lineTo(x, y)
    ctx.fillStyle = '#fff'
    ctx[operation]()
    ctx.beginPath()
    ctx.arc(x, y + l / 2, r, 1.5 * PI, 0.5 * PI)
    ctx.globalCompositeOperation = "xor"
    ctx.fill()
  }

  function sum(x, y) {
    return x + y
  }

  function square(x) {
    return x * x
  }

  class jigsaw {
    constructor(el, success, fail) {
      this.el = el
      this.success = success
      this.fail = fail
    }

    init() {
      this.initDOM()
      this.initImg()
      this.draw()
      this.bindEvents()
    }

    initDOM() {
      const canvas = createCanvas(w, h) // 画布
      const block = canvas.cloneNode(true) // 滑块

      block.className = 'block'
      const el = this.el
      el.appendChild(canvas)
      el.appendChild(block)
      Object.assign(this, {
        canvas,
        block,
        canvasCtx: canvas.getContext('2d'),
        blockCtx: block.getContext('2d')
      })
    }

    initImg() {
      const img = createImg(() => {
        this.canvasCtx.drawImage(img, 0, 0, w, h)
        this.blockCtx.drawImage(img, 0, 0, w, h)
        const y = this.y - r * 2 + 2
        const ImageData = this.blockCtx.getImageData(this.x, y, L, L)
        this.block.width = L
        this.block.height = L
        this.blockCtx.putImageData(ImageData,0,0,0,0,160,160);
      })
      this.img = img
    }

    draw() {
      // 随机创建滑块的位置
      this.x = getRandomNumberByRange(L + 10, w - (L + 10))
      this.y = getRandomNumberByRange(L + 10, h - (L + 10))
      // console.log(this.y);
      draw(this.canvasCtx, 'fill', this.x, this.y)
      draw(this.blockCtx, 'clip', this.x, this.y)
    }

    clean() {
      this.canvasCtx.clearRect(0, 0, w, h)
      this.blockCtx.clearRect(0, 0, w, h)
      this.block.width = w
      this.block.height = h
    }

    bindEvents() {
      let originX, originY,moveX, moveY, trail = [], isMouseDown = false,_this = this;
      this.block.addEventListener('mousedown', function (e) {
        originX = e.clientX-this.offsetLeft, originY = e.clientY -this.offsetTop
        isMouseDown = true

        document.addEventListener('mousemove', function (e) {
          if (!isMouseDown) return false
          // console.log(e.x,e.y);
          moveX = e.clientX - originX
          moveY = e.clientY - originY
          if (moveX < 0 || moveX + 160 >= w) return false
          if (moveY < 0 || moveY + 160 >= h) return false
          _this.block.style.left = moveX + 'px'
          _this.block.style.top = moveY + 'px'
          trail.push(moveY)
          trail.push(moveX)
        })

        document.addEventListener('mouseup',function (e) {
          document.onmousemove = document.onmouseup = null;
          if (!isMouseDown) return false
          isMouseDown = false
          if (e.x == originX || e.y == originY) return false
          _this.trail = trail
          const {spliced, TuringTest} = _this.verify()
          if (spliced) {
            if (TuringTest) {
              moveX = 0,moveY = 0
              _this.success && _this.success(_this);
            }
          } else {
            _this.fail && _this.fail()
          }
          if(_this.block.releaseCapture){
            _this.block.releaseCapture();
          }
        })
      })

    }

    reset() {
      this.block.style.left = 0
      this.block.style.top = 0
      this.clean()
      this.img.src = getRandomImg()
      this.draw()
    }

    verify() {
      const arr = this.trail // 拖动时y轴的移动距离
      const average = arr.reduce(sum) / arr.length // 平均值
      const deviations = arr.map(x => x - average) // 偏差数组
      const stddev = Math.sqrt(deviations.map(square).reduce(sum) / arr.length) // 标准差
      const left = parseInt(this.block.style.left)
      const top = parseInt(this.block.style.top)
      // console.log(top,this.y);
      // console.log(left,this.x);
      return {
        spliced: Math.abs(left - this.x) < 3 && Math.abs(top + r*2 -2 - this.y) < 3,
        TuringTest: average !== stddev, // 只是简单的验证拖动轨迹，相等时一般为0，表示可能非人为操作
      }
    }

  }

  window.jigsaw = {
    init: function (element, success, fail) {
      new jigsaw(element, success, fail).init()
    }
  }
}(window))