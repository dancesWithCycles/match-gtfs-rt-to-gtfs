'use strict'

const {readFileSync} = require('fs')
const {Client} = require('pg')
const QueryStream = require('pg-query-stream')
const stops = require('./lib/prepare-stable-ids/stops')
const routes = require('./lib/prepare-stable-ids/routes')

const ARRS_DEPS_WITH_STABLE_IDS = readFileSync(require.resolve('./lib/arrivals_departures_with_stable_ids.sql'))

;(async () => {
	const db = new Client()
	await db.connect()

	const convert = async ({query, onRow, beforeAll, afterAll}) => {
		if (beforeAll) process.stdout.write(beforeAll)
		const stream = db.query(new QueryStream(query))
		stream.on('data', onRow)
		await new Promise((resolve, reject) => {
			stream.once('end', () => {
				if (afterAll) process.stdout.write(afterAll)
				resolve()
			})
			stream.once('error', reject)
		})
	}

	console.error('stops')
	await convert(stops)
	console.error('routes')
	await convert(routes)

	process.stdout.write(ARRS_DEPS_WITH_STABLE_IDS)

	await db.end()
})()
.catch((err) => {
	console.error(err)
	process.exit(1)
})
