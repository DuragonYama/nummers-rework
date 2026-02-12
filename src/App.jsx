import { useState, useEffect, useRef } from 'react'
import PizZip from 'pizzip'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

function App() {
  const [startPosition, setStartPosition] = useState(1)
  const [inputNumbers, setInputNumbers] = useState('')
  const [parsedNumbers, setParsedNumbers] = useState([])
  const [documentSplits, setDocumentSplits] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [activeDocumentTab, setActiveDocumentTab] = useState(0)
  const [showValues, setShowValues] = useState(false)
  const [fuseDocuments, setFuseDocuments] = useState(false)
  const templateRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch('/template.docx')
        if (!response.ok) throw new Error('Template niet gevonden')

        const arrayBuffer = await response.arrayBuffer()
        const binary = new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
        templateRef.current = binary
        setTemplateLoaded(true)
      } catch (error) {
        console.error('Error loading template:', error)
        alert('❌ Template laden mislukt. Herlaad de pagina.')
      }
    }
    loadTemplate()
  }, [])

  // Parse input whenever it changes
  useEffect(() => {
    if (!inputNumbers.trim()) {
      setParsedNumbers([])
      setDocumentSplits([])
      setActiveDocumentTab(0) // Reset to Doc 1 when cleared
      return
    }

    const lines = inputNumbers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')

    setParsedNumbers(lines)
    calculateDocumentSplits(lines, startPosition)
  }, [inputNumbers, startPosition])

  // Reset to Doc 1 if active tab is out of bounds
  useEffect(() => {
    if (activeDocumentTab >= documentSplits.length && documentSplits.length > 0) {
      setActiveDocumentTab(0)
    }
  }, [documentSplits, activeDocumentTab])

  const calculateDocumentSplits = (numbers, start) => {
    if (numbers.length === 0) return

    const splits = []
    let currentDoc = 1
    let remainingInFirstDoc = 326 - start // positions available in first doc
    let numbersProcessed = 0

    // First document
    if (numbers.length <= remainingInFirstDoc) {
      // All fits in first document
      splits.push({
        docNumber: 1,
        startPos: start,
        endPos: start + numbers.length - 1,
        count: numbers.length,
        numbers: numbers
      })
    } else {
      // First document partial
      splits.push({
        docNumber: 1,
        startPos: start,
        endPos: 325,
        count: remainingInFirstDoc,
        numbers: numbers.slice(0, remainingInFirstDoc)
      })
      numbersProcessed = remainingInFirstDoc

      // Additional documents (always start at position 1)
      while (numbersProcessed < numbers.length) {
        currentDoc++
        const remaining = numbers.length - numbersProcessed
        const countInThisDoc = Math.min(remaining, 325)

        splits.push({
          docNumber: currentDoc,
          startPos: 1,
          endPos: countInThisDoc,
          count: countInThisDoc,
          numbers: numbers.slice(numbersProcessed, numbersProcessed + countInThisDoc)
        })

        numbersProcessed += countInThisDoc
      }
    }

    setDocumentSplits(splits)
  }

  const handlePositionClick = (position) => {
    setStartPosition(position)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      // Extract only column A (index 0) from each row
      const allValues = jsonData
        .map(row => row[0]) // Get first column only
        .filter(val => val !== undefined && val !== '')
      setInputNumbers(allValues.join('\n'))
    }
    reader.readAsArrayBuffer(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const generateDocuments = async () => {
    if (!templateRef.current || !templateLoaded) {
      alert('❌ Template is nog niet geladen. Wacht even en probeer opnieuw.')
      return
    }

    if (parsedNumbers.length === 0) {
      alert('❌ Voer eerst sticker nummers in!')
      return
    }

    setIsGenerating(true)

    try {
      // Check if we should fuse documents
      if (fuseDocuments && documentSplits.length > 1) {
        // FUSION MODE: Generate single multi-page document
        await generateFusedDocument()
      } else {
        // NORMAL MODE: Generate separate documents
        await generateSeparateDocuments()
      }

      const fileCount = fuseDocuments && documentSplits.length > 1 ? 1 : documentSplits.length
      alert(`✅ ${fileCount} bestand(en) succesvol gegenereerd!`)
    } catch (error) {
      console.error('Error generating documents:', error)
      alert('❌ Fout bij genereren. Check de console voor details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSeparateDocuments = async () => {
    const generatedFiles = []

    for (const split of documentSplits) {
      // Load template as ZIP
      const zip = new PizZip(templateRef.current)

      // Get document.xml
      let documentXml = zip.file('word/document.xml').asText()

      // Create a map of replacements for this document
      const replacements = {}
      for (let i = 0; i < split.count; i++) {
        const bookmarkName = `n${split.startPos + i}`
        replacements[bookmarkName] = split.numbers[i]
      }

      // Replace bookmark content
      for (let i = 1; i <= 325; i++) {
        const bookmarkName = `n${i}`
        const value = replacements[bookmarkName] || ''

        const bookmarkRegex = new RegExp(
          `<w:bookmarkStart w:id="(\\d+)" w:name="${bookmarkName}"[^>]*/>([\\s\\S]*?)<w:bookmarkEnd w:id="\\1"/>`,
          'g'
        )

        documentXml = documentXml.replace(bookmarkRegex, (match, bookmarkId, content) => {
          const rPrMatch = content.match(/<w:rPr>.*?<\/w:rPr>/s)
          const rPr = rPrMatch ? rPrMatch[0] : '<w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>'

          if (value) {
            return `<w:bookmarkStart w:id="${bookmarkId}" w:name="${bookmarkName}"/><w:r>${rPr}<w:t>${value}</w:t></w:r><w:bookmarkEnd w:id="${bookmarkId}"/>`
          } else {
            return `<w:bookmarkStart w:id="${bookmarkId}" w:name="${bookmarkName}"/><w:bookmarkEnd w:id="${bookmarkId}"/>`
          }
        })
      }

      zip.file('word/document.xml', documentXml)

      const output = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      generatedFiles.push({
        blob: output,
        filename: documentSplits.length > 1
          ? `USB_Stickers_${split.docNumber}.docx`
          : 'USB_Stickers.docx'
      })
    }

    // Download files
    if (generatedFiles.length === 1) {
      saveAs(generatedFiles[0].blob, generatedFiles[0].filename)
    } else {
      const zip = new JSZip()
      generatedFiles.forEach(file => {
        zip.file(file.filename, file.blob)
      })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, 'USB_Stickers_All.zip')
    }
  }

  const generateFusedDocument = async () => {
    // Load template as ZIP
    const zip = new PizZip(templateRef.current)
    let documentXml = zip.file('word/document.xml').asText()

    // Count total bookmarks in template to calculate proper ID offset
    const bookmarkMatches = documentXml.match(/<w:bookmarkStart/g)
    const totalBookmarksInTemplate = bookmarkMatches ? bookmarkMatches.length : 389

    // Extract the main table structure that contains all bookmarks
    const tableMatch = documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)
    if (!tableMatch) {
      throw new Error('Could not find table structure in template')
    }

    const originalTable = tableMatch[0]
    const tableStartIndex = documentXml.indexOf(originalTable)

    // Process first page (replace bookmarks in original table)
    let firstPageTable = originalTable
    const firstSplit = documentSplits[0]

    // Create replacements for first page
    const firstPageReplacements = {}
    for (let i = 0; i < firstSplit.count; i++) {
      const bookmarkName = `n${firstSplit.startPos + i}`
      firstPageReplacements[bookmarkName] = firstSplit.numbers[i]
    }

    // Replace bookmarks in first page
    for (let i = 1; i <= 325; i++) {
      const bookmarkName = `n${i}`
      const value = firstPageReplacements[bookmarkName] || ''

      const bookmarkRegex = new RegExp(
        `<w:bookmarkStart w:id="(\\d+)" w:name="${bookmarkName}"[^>]*/>([\\s\\S]*?)<w:bookmarkEnd w:id="\\1"/>`,
        'g'
      )

      firstPageTable = firstPageTable.replace(bookmarkRegex, (match, bookmarkId, content) => {
        const rPrMatch = content.match(/<w:rPr>.*?<\/w:rPr>/s)
        const rPr = rPrMatch ? rPrMatch[0] : '<w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>'

        if (value) {
          return `<w:bookmarkStart w:id="${bookmarkId}" w:name="${bookmarkName}"/><w:r>${rPr}<w:t>${value}</w:t></w:r><w:bookmarkEnd w:id="${bookmarkId}"/>`
        } else {
          return `<w:bookmarkStart w:id="${bookmarkId}" w:name="${bookmarkName}"/><w:bookmarkEnd w:id="${bookmarkId}"/>`
        }
      })
    }

    // Replace original table with first page table
    documentXml = documentXml.substring(0, tableStartIndex) +
                  firstPageTable +
                  documentXml.substring(tableStartIndex + originalTable.length)

    // Add subsequent pages
    for (let pageIndex = 1; pageIndex < documentSplits.length; pageIndex++) {
      const split = documentSplits[pageIndex]
      // Use actual template bookmark count for offset, not assumed 325
      const bookmarkIdOffset = pageIndex * totalBookmarksInTemplate

      // Page break with zero height/spacing to not reduce available table space
      const pageBreak = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="0" w:lineRule="exact"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'

      // Clone original table and update ALL bookmark IDs to ensure uniqueness
      let newPageTable = originalTable

      // Update ALL bookmark IDs (both start and end tags)
      newPageTable = newPageTable.replace(/w:id="(\d+)"/g, (match, id) => {
        const numericId = parseInt(id)
        return `w:id="${numericId + bookmarkIdOffset}"`
      })

      // Fill bookmarks with values for this page (only n1-n325 sticker bookmarks)
      for (let i = 1; i <= 325; i++) {
        const bookmarkName = `n${i}`
        const valueIndex = i - 1

        let value = ''
        if (valueIndex < split.count) {
          value = split.numbers[valueIndex]
        }

        // Find the bookmark in the cloned table (with new offset IDs)
        // We need to find which ID this bookmark has in the NEW table
        const bookmarkInOriginal = originalTable.match(
          new RegExp(`<w:bookmarkStart w:id="(\\d+)" w:name="${bookmarkName}"`, 'i')
        )

        if (bookmarkInOriginal) {
          const originalId = parseInt(bookmarkInOriginal[1])
          const adjustedId = originalId + bookmarkIdOffset

          const bookmarkRegex = new RegExp(
            `<w:bookmarkStart w:id="${adjustedId}" w:name="${bookmarkName}"[^>]*/>([\\s\\S]*?)<w:bookmarkEnd w:id="${adjustedId}"/>`,
            'g'
          )

          newPageTable = newPageTable.replace(bookmarkRegex, (match, content) => {
            const rPrMatch = content.match(/<w:rPr>.*?<\/w:rPr>/s)
            const rPr = rPrMatch ? rPrMatch[0] : '<w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>'

            if (value) {
              return `<w:bookmarkStart w:id="${adjustedId}" w:name="${bookmarkName}"/><w:r>${rPr}<w:t>${value}</w:t></w:r><w:bookmarkEnd w:id="${adjustedId}"/>`
            } else {
              return `<w:bookmarkStart w:id="${adjustedId}" w:name="${bookmarkName}"/><w:bookmarkEnd w:id="${adjustedId}"/>`
            }
          })
        }
      }

      // Insert page break + new table before </w:body>
      documentXml = documentXml.replace('</w:body>', `${pageBreak}${newPageTable}</w:body>`)
    }

    // Update document.xml and generate
    zip.file('word/document.xml', documentXml)

    const output = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    saveAs(output, `USB_Stickers_Combined_${documentSplits.length}pages.docx`)
  }

  // Create grid of 325 positions (13 rows × 5 columns × 5 numbers per block)
  const renderGrid = (documentIndex = 0) => {
    const blocks = []
    let position = 1

    // Get current document split
    const currentSplit = documentSplits[documentIndex]
    const isDoc1 = documentIndex === 0
    const isReadOnly = !isDoc1 // Doc 2+ are read-only

    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 5; col++) {
        const blockPositions = []
        for (let i = 0; i < 5; i++) {
          blockPositions.push(position)
          position++
        }

        // For Doc 1: selection works as before
        // For Doc 2+: no selection (read-only)
        const isSelected = isDoc1 && startPosition >= blockPositions[0] && startPosition <= blockPositions[4]

        // Check if this block has values in current document
        const isFilled = currentSplit && blockPositions.some(pos => {
          if (isDoc1) {
            return pos >= currentSplit.startPos && pos <= currentSplit.endPos
          } else {
            // Doc 2+ always start at position 1
            return pos >= 1 && pos <= currentSplit.count
          }
        })

        blocks.push(
          <div
            key={blockPositions[0]}
            className={`sticker-block ${isSelected ? 'selected' : ''} ${isFilled ? 'filled' : ''} ${isReadOnly ? 'cursor-default' : ''}`}
            onClick={() => !isReadOnly && handlePositionClick(blockPositions[0])}
          >
            {blockPositions.map(pos => {
              let displayValue = pos // Default: show position number

              // If toggle is ON and we have values, show actual sticker values
              if (showValues && currentSplit) {
                let valueIndex = -1

                if (isDoc1) {
                  // Doc 1: calculate based on startPos
                  if (pos >= currentSplit.startPos && pos <= currentSplit.endPos) {
                    valueIndex = pos - currentSplit.startPos
                  }
                } else {
                  // Doc 2+: start at position 1
                  if (pos >= 1 && pos <= currentSplit.count) {
                    valueIndex = pos - 1
                  }
                }

                if (valueIndex >= 0 && valueIndex < currentSplit.numbers.length) {
                  displayValue = currentSplit.numbers[valueIndex]
                } else {
                  // When toggle is ON but no value: show nothing (empty string)
                  displayValue = ''
                }
              }

              return (
                <div key={pos} className="sticker-number">
                  {displayValue}
                </div>
              )
            })}
          </div>
        )
      }
    }

    return blocks
  }

  return (
    <div className="min-h-screen bg-ofa-bg-dark p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-ofa-red mb-1">
            OFA
          </h1>
          <p className="text-base text-gray-400">
            USB Sticker Generator
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Position Grid */}
          <div className="bg-ofa-bg p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-3 text-white">
              Selecteer Startpositie
            </h2>

            {/* Document Tabs */}
            {documentSplits.length > 0 && (
              <div className="doc-tabs">
                {documentSplits.map((split, index) => (
                  <button
                    key={index}
                    className={`doc-tab ${activeDocumentTab === index ? 'active' : ''}`}
                    onClick={() => setActiveDocumentTab(index)}
                  >
                    Doc {split.docNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Toggle Switch */}
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={(e) => setShowValues(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <label
                className="toggle-label"
                onClick={() => setShowValues(!showValues)}
              >
                Toon Waarden
              </label>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Huidige startpositie: <span className="text-ofa-red font-mono">#{startPosition}</span>
              {activeDocumentTab > 0 && (
                <span className="text-gray-500 ml-2">(Doc {activeDocumentTab + 1} - Alleen lezen)</span>
              )}
            </p>

            {/* Scrollable Grid Container */}
            <div className="grid-container ofa-scrollbar">
              <div className="sticker-grid">
                {renderGrid(activeDocumentTab)}
              </div>
            </div>
          </div>

          {/* Right: Input & Controls */}
          <div className="flex flex-col gap-6">
            {/* Number Input */}
            <div className="bg-ofa-bg p-5 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Voer Nummers In
              </h2>

              {/* Excel Upload Button */}
              <div className="mb-4">
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:border-0
                      file:text-sm file:font-medium
                      file:bg-gray-700 file:text-white
                      hover:file:bg-gray-600
                      file:cursor-pointer file:transition-colors"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Upload Excel/CSV bestand <span className="text-gray-600">(experimental)</span>
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={inputNumbers}
                  onChange={(e) => setInputNumbers(e.target.value)}
                  placeholder="Plak hier je sticker nummers (één per regel)"
                  className="w-full h-56 bg-ofa-bg-dark text-white p-4 pr-24
                    border border-gray-700 focus:border-ofa-red focus:outline-none
                    font-mono text-sm resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-ofa-bg-dark px-2 py-1 border border-gray-800 pointer-events-none">
                  {parsedNumbers.length} nummers
                </div>
              </div>
            </div>

            {/* Preview - Always visible on mobile, conditional on desktop */}
            <div className={`bg-ofa-bg p-5 border border-gray-800 flex flex-col ${parsedNumbers.length === 0 ? 'lg:hidden' : ''}`}>
              <h2 className="text-lg font-semibold mb-4 text-white">
                Preview
              </h2>

              {parsedNumbers.length > 0 ? (
                <>
                  {/* Fusion Toggle - only show if multiple documents */}
                  {documentSplits.length > 1 && (
                    <div className="toggle-container mb-3">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={fuseDocuments}
                          onChange={(e) => setFuseDocuments(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <label
                        className="toggle-label"
                        onClick={() => setFuseDocuments(!fuseDocuments)}
                      >
                        Fuseer tot 1 document <span className="text-gray-600 text-xs">(experimental)</span>
                      </label>
                    </div>
                  )}

                  <div className="preview-scroll max-h-[400px] overflow-y-auto space-y-3 mb-4">
                    {documentSplits.map((split, idx) => (
                      <div key={idx} className="bg-ofa-bg-dark p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-ofa-red">
                            Document {split.docNumber}
                          </span>
                          <span className="text-sm text-gray-400">
                            {split.count} {split.count === 1 ? 'sticker' : 'stickers'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mb-1">
                          Posities {split.startPos} - {split.endPos}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Eerste: {split.numbers[0]} | Laatste: {split.numbers[split.numbers.length - 1]}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateDocuments}
                    disabled={isGenerating || !templateLoaded}
                    className="w-full bg-ofa-red hover:bg-ofa-red-hover
                      text-white font-semibold py-3.5 px-6
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    {isGenerating
                      ? 'Bezig met genereren...'
                      : fuseDocuments && documentSplits.length > 1
                        ? `Genereer 1 Document (${documentSplits.length} pagina's)`
                        : documentSplits.length === 1
                          ? 'Genereer Document'
                          : `Genereer ${documentSplits.length} Documenten`
                    }
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
                  Geen preview beschikbaar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        {!templateLoaded && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Template laden...
          </div>
        )}
      </div>
    </div>
  )
}

export default App
