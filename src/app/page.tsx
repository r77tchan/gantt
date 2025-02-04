'use client'

import { useState, useRef } from 'react'
import styles from './page.module.css'

export default function Home() {
  const initialTasks = [
    { id: 1, task: 'ユーザー一覧画面作成', person: 'Aさん', date1: '', date2: '', date3: '', date4: '' },
    { id: 2, task: 'ユーザー登録画面作成', person: 'Bさん', date1: '', date2: '', date3: '', date4: '' },
    { id: 3, task: 'ユーザー削除画面作成', person: 'Cさん', date1: '', date2: '', date3: '', date4: '' },
    { id: 4, task: 'テスト1', person: 'テスト1さん', date1: '', date2: '', date3: '', date4: '' },
    { id: 5, task: 'テスト2', person: 'テスト2さん', date1: '', date2: '', date3: '', date4: '' },
    { id: 6, task: 'テスト3', person: 'テスト3さん', date1: '', date2: '', date3: '', date4: '' },
    { id: 7, task: 'テスト4', person: 'テスト4さん', date1: '', date2: '', date3: '', date4: '' },
    { id: 8, task: 'テスト5', person: 'テスト5さん', date1: '', date2: '', date3: '', date4: '' },
  ]

  // タスク本体
  const [tasks, setTasks] = useState(initialTasks)
  // 進捗率
  const [progress, setProgress] = useState<{ [key: number]: number }>(
    Object.fromEntries(initialTasks.map(({ id }) => [id, 0]))
  )

  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [draggedRows, setDraggedRows] = useState<number[]>([])
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const [indentLevels, setIndentLevels] = useState<{ [key: number]: number }>({})
  // 日数計算結果
  const [dateDiffs, setDateDiffs] = useState<{ [key: number]: { first: number | string; second: number | string } }>({})

  const tableRef = useRef<HTMLTableElement | null>(null)
  const startPoint = useRef<{ x: number; y: number } | null>(null)

  // ダブルクリックで行を選択
  const handleRowDoubleClick = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows([])
    } else {
      setSelectedRows([id])
    }
  }

  // 1️⃣ ドラッグ開始（範囲選択）
  const handleMouseDown = (event: React.MouseEvent) => {
    if (selectedRows.length > 0) return // すでに選択されているなら並び替えモード優先

    startPoint.current = { x: event.clientX, y: event.clientY }
    setSelectionBox({ x: event.clientX, y: event.clientY, width: 0, height: 0 })

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 2️⃣ ドラッグ中（範囲選択の四角を更新）
  const handleMouseMove = (event: MouseEvent) => {
    if (!startPoint.current) return

    const x = Math.min(startPoint.current.x, event.clientX)
    const y = Math.min(startPoint.current.y, event.clientY)
    const width = Math.abs(event.clientX - startPoint.current.x)
    const height = Math.abs(event.clientY - startPoint.current.y)

    setSelectionBox({ x, y, width, height })

    // 選択範囲内の行をハイライト
    if (tableRef.current) {
      const rows = Array.from(tableRef.current.querySelectorAll('tr'))
      const selectedIds = rows
        .filter((row) => {
          const rowRect = row.getBoundingClientRect()
          return x < rowRect.right && x + width > rowRect.left && y < rowRect.bottom && y + height > rowRect.top
        })
        .map((row) => Number(row.getAttribute('data-id')))

      setSelectedRows(selectedIds)
    }
  }

  // 3️⃣ ドラッグ終了（選択確定）
  const handleMouseUp = () => {
    setSelectionBox(null)
    startPoint.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseUp', handleMouseUp)
  }

  // ドラッグ開始
  const handleDragStart = (id: number) => {
    if (selectedRows.includes(id)) {
      setDraggedRows([...selectedRows]) // すでに選択されている行をそのままドラッグ
    }
  }

  // ドラッグした行の上に他の行が乗った時の処理
  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, targetId: number) => {
    event.preventDefault() // ドラッグを許可

    if (draggedRows.length === 0 || draggedRows.includes(targetId)) return

    const newTasks = [...tasks]
    const targetIndex = newTasks.findIndex((task) => task.id === targetId)
    const draggedIndexes = draggedRows.map((id) => newTasks.findIndex((task) => task.id === id))

    // 選択群の最小インデックス（先頭行）
    const minDraggedIndex = Math.min(...draggedIndexes)

    if (minDraggedIndex < targetIndex) {
      // 選択群が上でカーソルが下の場合
      // カーソルの位置の行を選択群の一番上にする
      const movedTasks = newTasks.filter((task) => !draggedRows.includes(task.id)) // 選択された行を一旦削除
      const insertIndex = movedTasks.findIndex((task) => task.id === targetId) + 1 // 挿入する位置

      movedTasks.splice(insertIndex, 0, ...newTasks.filter((task) => draggedRows.includes(task.id))) // 選択群を挿入
      setTasks(movedTasks)
    } else {
      // 選択群が下でカーソルが上の場合
      const movedTasks = newTasks.filter((task) => !draggedRows.includes(task.id))
      const insertIndex = movedTasks.findIndex((task) => task.id === targetId) // 挿入する位置

      movedTasks.splice(insertIndex, 0, ...newTasks.filter((task) => draggedRows.includes(task.id)))
      setTasks(movedTasks)
    }
  }

  // ドラッグ終了時に状態をリセット
  const handleDragEnd = () => {
    setDraggedRows([])
    setSelectedRows([])
  }

  // インデント
  const handleIndentLeft = () => {
    setIndentLevels((prev) => {
      const newLevels = { ...prev }
      selectedRows.forEach((id) => {
        if (!newLevels[id]) newLevels[id] = 0 // 初期値が未定義なら 0 にする
        if (newLevels[id] > 0) newLevels[id] -= 1 // 最小 0 まで減らす
      })
      return newLevels
    })
  }
  const handleIndentRight = () => {
    setIndentLevels((prev) => {
      const newLevels = { ...prev }
      selectedRows.forEach((id) => {
        if (!newLevels[id]) newLevels[id] = 0 // 初期値が未定義なら 0 にする
        if (newLevels[id] < 3) newLevels[id] += 1 // 最大 3 まで増やす
      })
      return newLevels
    })
  }

  // 日数計算
  const handleDateChange = (id: number, dateIndex: 1 | 2 | 3 | 4, value: string) => {
    setTasks((prevTasks) => {
      const newTasks = prevTasks.map((task) => (task.id === id ? { ...task, [`date${dateIndex}`]: value } : task))

      setDateDiffs((prevDiffs) => {
        const newDiffs = { ...prevDiffs }

        // 更新後の `newTasks` を参照
        const task = newTasks.find((task) => task.id === id)
        const date1 = new Date(task?.date1 || '')
        const date2 = new Date(task?.date2 || '')
        const date3 = new Date(task?.date3 || '')
        const date4 = new Date(task?.date4 || '')

        const firstDiff =
          isNaN(date1.getTime()) || isNaN(date2.getTime())
            ? ''
            : Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const secondDiff =
          isNaN(date3.getTime()) || isNaN(date4.getTime())
            ? ''
            : Math.ceil((date4.getTime() - date3.getTime()) / (1000 * 60 * 60 * 24)) + 1

        newDiffs[id] = { first: firstDiff, second: secondDiff }
        return newDiffs
      })

      return newTasks // `setTasks()` を更新
    })
  }

  // ----------------------------------------
  // 日付を「時刻リセット」する関数 (タイムゾーン対策)
  // ----------------------------------------
  function toDateOnly(dateStr?: string) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    // タイムゾーンの影響を除去 (UTC の 0:00 に)
    d.setUTCHours(0, 0, 0, 0)
    return d
  }

  return (
    <div className={styles.body}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.indentDiv}>
          <button className={styles.indent_left} onClick={handleIndentLeft}>
            ←
          </button>
          <button className={styles.indent_right} onClick={handleIndentRight}>
            →
          </button>
        </div>
      </header>

      {/* ガントチャート */}
      <main className={styles.main} onMouseDown={handleMouseDown}>
        <table className={styles.table} ref={tableRef}>
          {/* テーブルヘッダー */}
          <thead className={styles.thead}>
            <tr>
              <th rowSpan={3}>No</th>
              <th rowSpan={3}>作業名</th>
              <th rowSpan={3}>担当者</th>
              <th rowSpan={3}>進捗率</th>
              <th rowSpan={3}>状況</th>
              <th colSpan={3}>予定</th>
              <th colSpan={3}>実績</th>
              <th rowSpan={3}>先行</th>
              <th colSpan={11}>2025/2</th>
            </tr>
            <tr>
              <th rowSpan={2}>開始日</th>
              <th rowSpan={2}>終了日</th>
              <th rowSpan={2}>日数</th>
              <th rowSpan={2}>開始日</th>
              <th rowSpan={2}>終了日</th>
              <th rowSpan={2}>日数</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>6</th>
              <th>7</th>
              <th>8</th>
              <th>9</th>
              <th>10</th>
              <th>11</th>
            </tr>
            <tr>
              <th>土</th>
              <th>日</th>
              <th>月</th>
              <th>火</th>
              <th>水</th>
              <th>木</th>
              <th>金</th>
              <th>土</th>
              <th>日</th>
              <th>月</th>
              <th>火</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {tasks.map(({ id, task, person, date1, date2, date3, date4 }) => (
              <tr
                key={id}
                data-id={id}
                draggable={selectedRows.includes(id)}
                onDoubleClick={() => handleRowDoubleClick(id)}
                onDragStart={() => handleDragStart(id)}
                onDragOver={(e) => handleDragOver(e, id)}
                onDragEnd={handleDragEnd}
                className={selectedRows.includes(id) ? styles.selectedRow : ''}
              >
                <td className={styles.gray_back}>{id}</td>
                <td style={{ paddingLeft: indentLevels[id] ? `${12 * indentLevels[id]}px` : '0px' }}>{task}</td>
                <td>{person}</td>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={progress[id] || 0}
                    onChange={(e) => setProgress((prev) => ({ ...prev, [id]: Number(e.target.value) }))}
                  />
                </td>
                <td>進行中</td>
                <td>
                  <input type="date" value={date1 || ''} onChange={(e) => handleDateChange(id, 1, e.target.value)} />
                </td>
                <td>
                  <input type="date" value={date2 || ''} onChange={(e) => handleDateChange(id, 2, e.target.value)} />
                </td>
                <td className={styles.gray_back}>{dateDiffs[id]?.first ?? ''}</td>
                <td>
                  <input type="date" value={date3 || ''} onChange={(e) => handleDateChange(id, 3, e.target.value)} />
                </td>
                <td>
                  <input type="date" value={date4 || ''} onChange={(e) => handleDateChange(id, 4, e.target.value)} />
                </td>
                <td className={styles.gray_back}>{dateDiffs[id]?.second ?? ''}</td>
                <td></td>

                {[...Array(11)].map((_, idx) => {
                  // 当セルの日付 (2025/2/1 ～ 2/11) を UTC 0:00 で生成
                  const currentDate = new Date(Date.UTC(2025, 1, idx + 1))

                  // --- ① 予定 (date1～date2) の進捗背景を算出 ---
                  // date1, date2 を UTC の 0:00 に
                  const startPlanned = toDateOnly(date1)
                  const endPlanned = toDateOnly(date2)

                  // デフォルトは透明
                  let plannedBackground = 'transparent'

                  if (startPlanned && endPlanned && currentDate >= startPlanned && currentDate <= endPlanned) {
                    // 予定範囲内なら進捗率に応じて色を決定
                    const msDiffPlanned = endPlanned.getTime() - startPlanned.getTime()
                    const daysPlanned = Math.floor(msDiffPlanned / 86400000) + 1 // +1 で開始日を含む

                    // localIndex = 開始日から何日目か (0-based)
                    const msDiffCurrent = currentDate.getTime() - startPlanned.getTime()
                    const localIndex = Math.floor(msDiffCurrent / 86400000)

                    // progressRatio
                    const ratio = (progress[id] || 0) / 100
                    const progressAll = daysPlanned * ratio // 例: 3 * 0.8 = 2.4
                    const progressDays = Math.floor(progressAll) // 完全塗り日数 (整数部)
                    const partialRatio = progressAll % 1 // 部分塗り (小数部)

                    // 予定のデフォルト色 (青)
                    plannedBackground = 'rgba(0, 122, 255, 0.3)'

                    if (localIndex < progressDays) {
                      // 完全に黄色
                      plannedBackground = 'rgba(255, 204, 0, 0.8)'
                    } else if (localIndex === progressDays && progressDays < daysPlanned) {
                      // 部分塗り
                      const pc = partialRatio * 100 // 0.4 -> 40%
                      plannedBackground = `linear-gradient(to right, rgba(255, 204, 0, 0.8) ${pc}%, rgba(0, 122, 255, 0.3) ${pc}%)`
                    }
                  }

                  // --- ② 実績 (date3～date4) 判定: 下30% に濃い青を重ねる ---
                  const startActual = toDateOnly(date3)
                  const endActual = toDateOnly(date4)
                  let isInActualRange = false

                  if (startActual && endActual && currentDate >= startActual && currentDate <= endActual) {
                    isInActualRange = true
                  }

                  return (
                    <td
                      key={idx}
                      style={{
                        position: 'relative', // 下30%の描画用に絶対配置を使う
                        padding: 0,
                        background: plannedBackground, // 予定の背景色
                      }}
                    >
                      {/* 実績範囲なら、下30%を濃い青で塗る */}
                      {isInActualRange && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '30%',
                            background: 'rgba(0, 0, 139, 1)', // 濃い青 (DarkBlue)
                          }}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      {/* 範囲選択の四角を描画 */}
      {selectionBox && (
        <div
          className={styles.selectionBox}
          style={{
            position: 'absolute',
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            backgroundColor: 'rgba(0, 122, 255, 0.2)',
            border: '1px solid rgba(0, 122, 255, 0.8)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
