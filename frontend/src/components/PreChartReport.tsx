import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';

const PreChartReport = () => {
  const [report, setReport] = useState('');
  const previousReportRef = useRef('');

  useEffect(() => {
    // Setup report streaming WebSocket
    const reportWs = new WebSocket('ws://localhost:8006/stream-report');
    reportWs.onmessage = (event) => {
      setReport(currentReport => {
        previousReportRef.current = currentReport;
        return event.data;
      });
    };
    reportWs.onerror = (error) => {
      console.error('Report WebSocket error:', error);
    };

    return () => {
      reportWs.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-lg shadow-md flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Pre-Chart Report</h1>
        <div className="flex-1 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              ins: ({ node, ...props }) => <span style={{ backgroundColor: '#e6ffed' }} {...props} />,
              del: ({ node, ...props }) => <span style={{ backgroundColor: '#ffebe9', textDecoration: 'line-through' }} {...props} />,
            }}
          >
            {(() => {
              if (!previousReportRef.current) {
                return report;
              }
              const dmp = new diff_match_patch();
              const diffs = dmp.diff_main(previousReportRef.current, report);
              dmp.diff_cleanupSemantic(diffs);
              let html = '';
              for (const [op, text] of diffs) {
                switch (op) {
                  case DIFF_INSERT:
                    html += `<ins>${text}</ins>`;
                    break;
                  case DIFF_DELETE:
                    html += `<del>${text}</del>`;
                    break;
                  case DIFF_EQUAL:
                    html += text;
                    break;
                }
              }
              return html;
            })()}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PreChartReport;
