export interface ThermalPrinterOptions {
  paperWidth: 58 | 80
  baudRate?: number
}

interface BluetoothPrinter {
  type: 'bluetooth'
  device: BluetoothDevice
  server: BluetoothRemoteGATTServer
  characteristic: BluetoothRemoteGATTCharacteristic
}

interface SerialPrinter {
  type: 'serial'
  port: SerialPort
  writer: WritableStreamDefaultWriter<Uint8Array>
}

type PrinterConnection = BluetoothPrinter | SerialPrinter

const ESC = 0x1b
const GS = 0x1d

const CMD = {
  INIT: new Uint8Array([ESC, 0x40]),
  BOLD_ON: new Uint8Array([ESC, 0x45, 1]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0]),
  CENTER: new Uint8Array([ESC, 0x61, 1]),
  LEFT: new Uint8Array([ESC, 0x61, 0]),
  RIGHT: new Uint8Array([ESC, 0x61, 2]),
  CUT_PARTIAL: new Uint8Array([GS, 0x56, 1]),
  FEED_LINES: (n: number) => new Uint8Array([ESC, 0x64, n]),
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function lineForWidth(text: string, width: number): string {
  return text.length > width ? text.slice(0, width) : text.padEnd(width)
}

export class ThermalPrinter {
  private conn: PrinterConnection | null = null
  private options: ThermalPrinterOptions

  constructor(options?: Partial<ThermalPrinterOptions>) {
    this.options = { paperWidth: 80, baudRate: 9600, ...options }
  }

  async connectBluetooth(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API not supported')
    }

    const device = await navigator.bluetooth.requestDevice({ filters: [] })
    const server = await device.gatt?.connect()
    if (!server) throw new Error('Could not connect to GATT server')

    let characteristic: BluetoothRemoteGATTCharacteristic | null = null

    for (const serviceUUID of device.uuids ?? []) {
      try {
        const service = await server.getPrimaryService(serviceUUID)
        const chars = await service.getCharacteristics()
        const writable = chars.find(
          (c) => c.properties.write || c.properties.writeWithoutResponse
        )
        if (writable) {
          characteristic = writable
          break
        }
      } catch {
        continue
      }
    }

    if (!characteristic) {
      throw new Error('No writable characteristic found on device')
    }

    this.conn = { type: 'bluetooth', device, server, characteristic }
  }

  async connectSerial(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported')
    }

    const port = await (navigator as unknown as { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort()
    await port.open({ baudRate: this.options.baudRate })
    const writer = port.writable.getWriter()
    this.conn = { type: 'serial', port, writer }
  }

  async connect(method: 'bluetooth' | 'serial' = 'serial'): Promise<void> {
    if (method === 'bluetooth') await this.connectBluetooth()
    else await this.connectSerial()
  }

  async disconnect(): Promise<void> {
    if (!this.conn) return
    if (this.conn.type === 'bluetooth') {
      this.conn.device.gatt?.disconnect()
    } else {
      this.conn.writer.releaseLock()
      await this.conn.port.close()
    }
    this.conn = null
  }

  isConnected(): boolean {
    return this.conn !== null
  }

  private async send(data: Uint8Array): Promise<void> {
    if (!this.conn) throw new Error('Printer not connected')
    if (this.conn.type === 'bluetooth') {
      await this.conn.characteristic.writeValueWithoutResponse(data)
    } else {
      await this.conn.writer.write(data)
    }
  }

  async printText(text: string): Promise<void> {
    const w = this.options.paperWidth
    await this.send(CMD.INIT)
    for (const line of text.split('\n')) {
      await this.send(textToBytes(lineForWidth(line, w)))
      await this.send(new Uint8Array([0x0a]))
    }
  }

  async printReceipt(receiptData: {
    title?: string
    lines: string[]
    bold?: string[]
    center?: string[]
    footer?: string
  }): Promise<void> {
    const w = this.options.paperWidth
    await this.send(CMD.INIT)
    await this.send(CMD.LEFT)

    if (receiptData.title) {
      await this.send(CMD.CENTER)
      await this.send(CMD.BOLD_ON)
      await this.send(textToBytes(lineForWidth(receiptData.title, w)))
      await this.send(new Uint8Array([0x0a]))
      await this.send(CMD.BOLD_OFF)
      await this.send(CMD.LEFT)
      await this.send(new Uint8Array([0x0a]))
    }

    for (const line of receiptData.lines) {
      const isBold = receiptData.bold?.includes(line) ?? false
      const isCenter = receiptData.center?.includes(line) ?? false
      if (isCenter) await this.send(CMD.CENTER)
      if (isBold) await this.send(CMD.BOLD_ON)
      await this.send(textToBytes(lineForWidth(line, w)))
      await this.send(new Uint8Array([0x0a]))
      if (isBold) await this.send(CMD.BOLD_OFF)
      if (isCenter) await this.send(CMD.LEFT)
    }

    if (receiptData.footer) {
      await this.send(CMD.CENTER)
      await this.send(new Uint8Array([0x0a]))
      await this.send(textToBytes(lineForWidth(receiptData.footer, w)))
      await this.send(new Uint8Array([0x0a]))
      await this.send(CMD.LEFT)
    }

    await this.send(CMD.FEED_LINES(3))
    await this.send(CMD.CUT_PARTIAL)
  }

  getPaperWidth(): 58 | 80 {
    return this.options.paperWidth
  }

  setPaperWidth(width: 58 | 80): void {
    this.options.paperWidth = width
  }
}

export const thermalPrinter = new ThermalPrinter()
