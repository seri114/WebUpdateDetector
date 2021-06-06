import * as jsdom from 'jsdom'
import * as diff from 'diff'
const TinySegmenter = require('tiny-segmenter')
const segmenter = new TinySegmenter()

function createTextElement (t: string, tag: string): HTMLElement {
  const d = (new jsdom.JSDOM()).window.document
  const span = d.createElement(tag)
  span.appendChild(d
    .createTextNode(t))
  return span
}

function createCrElement (): HTMLElement {
  const cr = `
`
  return createTextElement(cr, 'pre')
}

function createLinkElement (URL: string) {
  const d = (new jsdom.JSDOM()).window.document
  const createA = d.createElement('a')
  const createAText = d.createTextNode(URL)
  createA.setAttribute('href', URL)
  createA.appendChild(createAText)
  return createA
}

export function createDiffElement (text1: string, text2: string): HTMLHtmlElement {
  const t1array = text1.split('\n')
  const t2array = text2.split('\n')
  const document = (new jsdom.JSDOM()).window.document

  const root = document.createElement('html')
  const lastText: string[] = []
  const beforeAndAfterLength = 5
  let diffDisplayCount = -1
  const maxMessageLength = 1500
  let messageLengthCounter = 0

  const appendElement = function appendElement (root: HTMLHtmlElement, e: HTMLElement) {
    messageLengthCounter += e.outerHTML.length
    if (messageLengthCounter > maxMessageLength) {
      messageLengthCounter = 0
      throw new Error('max length exceed')
    }
    root.appendChild(e)
  }
  const appendText = function appendText (root: HTMLHtmlElement, e: Text) {
    if (e.textContent === null) {
      return
    }
    messageLengthCounter += e.textContent?.length
    if (messageLengthCounter > maxMessageLength) {
      messageLengthCounter = 0
      throw new Error('max length exceed')
    }
    root.appendChild(e)
  }

  try {
    for (let index = 0; index < t1array.length; index++) {
      const t1 = t1array[index]
      const t2 = t2array[index]

      const ret = diff.diffWords(t1, t2)
      // console.log(ret)

      if (diffDisplayCount === 0) {
        break
      } else if (diffDisplayCount > 0) {
        diffDisplayCount--
      }

      if (t1 === t2) {
        if (diffDisplayCount >= 0) {
          appendElement(root, createTextElement(t1, 'pre'))
          appendElement(root, createCrElement())
        } else {
          lastText.push(t1)
        }
      } else {
        if (diffDisplayCount === -1) {
          diffDisplayCount = beforeAndAfterLength
          for (let index = lastText.length - 1; index >= 0; index--) {
            const t = lastText[index]
            appendElement(root, createTextElement(t, 'pre'))
            appendElement(root, createCrElement())
            if (beforeAndAfterLength === (lastText.length - 1 - index)) {
              break
            }
          }
        }
        ret.forEach((part: any) => {
          if (part.removed) {
            appendElement(root, createTextElement(part.value, 's'))
          } else if (part.added) {
            appendElement(root, createTextElement(part.value, 'b'))
          } else {
            appendText(root, document.createTextNode(part.value))
          }
          appendText(root, document.createTextNode(' '))
        })
        appendElement(root, createCrElement())
      }
    }
  } catch (e) {
    appendText(root, document.createTextNode('\nmessage length exceeded'))
    return root
  }
  return root
}

export function createDiffHTML (title: string, url: string, text1: string, text2: string): HTMLHtmlElement {
  const diff = createDiffElement(text1, text2)
  diff.insertAdjacentElement('afterbegin', createCrElement())
  diff.insertAdjacentElement('afterbegin', createTextElement(title, 'b'))
  diff.insertAdjacentElement('beforeend', createCrElement())
  diff.insertAdjacentElement('beforeend', createLinkElement(url))
  return diff
}

function segmentText (s: string): string {
  s = segmenter.segment(s).join(' ')
  return s
}

export function checkTextNearlyEqual (text1: string, text2: string): boolean {
  if (text1 === text2) {
    return true
  }
  text1 = segmentText(text1)
  text2 = segmentText(text2)
  const ret = diff.diffWords(text1, text2)
  let removeCounter = 0
  let addCounter = 0
  let otherCounter = 0
  ret.forEach((part: any) => {
    if (part.removed) {
      removeCounter += part.count
    } else if (part.added) {
      addCounter += part.count
    }
    otherCounter += part.count
  })
  const diffScore = ((addCounter + removeCounter) / otherCounter)
  if (diffScore < 0.01) {
    if (diffScore > 0) {
      console.log(`under 0.01, equal: ${diffScore}`)
    }
    return true
  }
  if (diffScore > 0) {
    console.log(`over 0.01: ${diffScore}`)
  }
  return false
}
