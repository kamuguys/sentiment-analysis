#!/usr/bin/env node
import * as queueRepo from '../repositories/analysisQueueRepository.js'
import { processAnalysisJobs } from './processAnalysisQueue.js'

const POLL_INTERVAL_MS = Number(process.env.QUEUE_POLL_INTERVAL_MS || 15000)
const CLAIM_LIMIT = Number(process.env.QUEUE_CLAIM_LIMIT || 5)
const PROCESSOR_ID = process.env.PROCESSOR_ID || 'queue-worker'
let stopped = false

async function runOnce() {
  try {
    const jobs = await queueRepo.claimPendingAnalysis(CLAIM_LIMIT, PROCESSOR_ID)
    if (!jobs || jobs.length === 0) {
      return { claimed: 0 }
    }
    const results = await processAnalysisJobs(jobs)
    return { claimed: jobs.length, results }
  } catch (err) {
    console.error('queue worker error', err)
    return { error: String(err) }
  }
}

async function runLoop() {
  while (!stopped) {
    const result = await runOnce()
    if (result.error) {
      console.error(result.error)
    } else if (result.claimed === 0) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }
}

function shutdown() {
  if (!stopped) {
    stopped = true
    console.log('queue worker shutting down...')
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

;(async () => {
  console.log(`queue worker started: processorId=${PROCESSOR_ID}, claimLimit=${CLAIM_LIMIT}, interval=${POLL_INTERVAL_MS}ms`)
  await runLoop()
  console.log('queue worker stopped')
  process.exit(0)
})()
