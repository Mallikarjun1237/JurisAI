/**
 * SpacetimeGrid — Einstein's Gravitational Spacetime Curvature Background Canvas
 *
 * Implements Einstein's General Relativity visual model:
 * - A coordinate mesh of space-time fabric across the entire background
 * - As the cursor moves, space-time curves, bends, and converges into a gravitational well
 * - On click, a subtle gravitational ripple propagates through the cosmic grid
 * - Highly optimized 60fps HTML5 Canvas with spring dampening and automatic sleep when idle
 */
import React, { useEffect, useRef } from 'react'

export default function SpacetimeGrid({
  spacing = 38,             // Distance between grid lines (px)
  gravityRadius = 240,      // Range of Einstein gravitational well (px)
  maxConvergence = 48,      // Max displacement pull inward (px)
  showGravitationalLens = true, // Soft lens glow at center of mass
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId
    let isRunning = true
    let width = window.innerWidth
    let height = window.innerHeight

    // Cosmic mass (Cursor) state
    const mouse = {
      targetX: width / 2,
      targetY: height / 2,
      currX: width / 2,
      currY: height / 2,
      isActive: false,
      lastMoved: Date.now(),
    }

    // Gravitational wave ripples (triggered on user click)
    let ripples = []

    // Spacetime Grid Vertices Mesh
    let cols = 0
    let rows = 0
    let grid = []

    const initGrid = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      if (ctx.resetTransform) {
        ctx.resetTransform()
      }
      ctx.scale(dpr, dpr)

      cols = Math.ceil(width / spacing) + 2
      rows = Math.ceil(height / spacing) + 2
      grid = []

      for (let r = 0; r < rows; r++) {
        const row = []
        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing - spacing / 2
          const baseY = r * spacing - spacing / 2
          row.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
          })
        }
        grid.push(row)
      }
    }

    initGrid()

    // Event Handlers
    const handlePointerMove = (e) => {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY
      mouse.isActive = true
      mouse.lastMoved = Date.now()
      if (!isRunning) {
        isRunning = true
        render()
      }
    }

    const handlePointerLeave = () => {
      mouse.isActive = false
    }

    const handleClick = (e) => {
      // Spawn a gravitational ripple wave expanding across the space-time fabric
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.6,
        amplitude: 18,
        speed: 12,
        opacity: 0.7,
      })
      if (!isRunning) {
        isRunning = true
        render()
      }
    }

    const handleResize = () => {
      initGrid()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)

    // Animation & Physics Loop
    const render = () => {
      // Smoothly interpolate the gravitational mass center (lerp)
      const lerpFactor = 0.16
      mouse.currX += (mouse.targetX - mouse.currX) * lerpFactor
      mouse.currY += (mouse.targetY - mouse.currY) * lerpFactor

      // Fade out mass influence if inactive for > 3.5s
      const idleTime = Date.now() - mouse.lastMoved
      const massStrength = mouse.isActive ? 1 : Math.max(0, 1 - (idleTime - 1000) / 2500)

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i]
        rip.radius += rip.speed
        rip.amplitude *= 0.95
        rip.opacity *= 0.96
        if (rip.radius > rip.maxRadius || rip.opacity < 0.02) {
          ripples.splice(i, 1)
        }
      }

      ctx.clearRect(0, 0, width, height)

      let totalDisplacement = 0

      // Physics pass: calculate Einstein curvature and gravitational pull
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c]
          let targetX = pt.baseX
          let targetY = pt.baseY

          // 1. Gravitational Well Distortion (Einstein Space-time Inward Convergence)
          if (massStrength > 0.01) {
            const dx = mouse.currX - pt.baseX
            const dy = mouse.currY - pt.baseY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < gravityRadius && dist > 0.1) {
              const u = 1 - dist / gravityRadius // 1 at center, 0 at boundary
              // General relativity curvature curve: steep near center, smooth taper outward
              const pull = maxConvergence * (u * u * (1 - 0.2 * u)) * massStrength
              targetX += (dx / dist) * pull
              targetY += (dy / dist) * pull
            }
          }

          // 2. Gravitational Wave Ripples Distortion
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i]
            const rdx = pt.baseX - rip.x
            const rdy = pt.baseY - rip.y
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy)
            const diff = Math.abs(rdist - rip.radius)
            const waveWidth = 45

            if (diff < waveWidth && rdist > 0.1) {
              const waveU = Math.cos((diff / waveWidth) * (Math.PI / 2))
              const displacement = rip.amplitude * waveU
              targetX += (rdx / rdist) * displacement
              targetY += (rdy / rdist) * displacement
            }
          }

          // 3. Elastic Spring Physics for natural fabric relaxation
          const springK = 0.22
          pt.x += (targetX - pt.x) * springK
          pt.y += (targetY - pt.y) * springK

          totalDisplacement += Math.abs(pt.x - pt.baseX) + Math.abs(pt.y - pt.baseY)
        }
      }

      // Drawing pass: render warped space-time horizontal and vertical coordinate lines
      ctx.lineWidth = 1

      // ── Draw Horizontal Spacetime Lines ──
      for (let r = 0; r < rows; r++) {
        ctx.beginPath()
        ctx.moveTo(grid[r][0].x, grid[r][0].y)

        for (let c = 1; c < cols; c++) {
          const curr = grid[r][c]
          const prev = grid[r][c - 1]
          // Midpoint quadratic smoothing for organic curves
          const midX = (prev.x + curr.x) / 2
          const midY = (prev.y + curr.y) / 2
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY)
        }

        ctx.lineTo(grid[r][cols - 1].x, grid[r][cols - 1].y)
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)' // Subtle Indigo baseline coordinate fabric
        ctx.stroke()
      }

      // ── Draw Vertical Spacetime Lines ──
      for (let c = 0; c < cols; c++) {
        ctx.beginPath()
        ctx.moveTo(grid[0][c].x, grid[0][c].y)

        for (let r = 1; r < rows; r++) {
          const curr = grid[r][c]
          const prev = grid[r - 1][c]
          const midX = (prev.x + curr.x) / 2
          const midY = (prev.y + curr.y) / 2
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY)
        }

        ctx.lineTo(grid[rows - 1][c].x, grid[rows - 1][c].y)
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)'
        ctx.stroke()
      }

      // ── Highlight Warped Geodesics & Intersections inside the Gravity Well ──
      if (massStrength > 0.05) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const pt = grid[r][c]
            const dx = mouse.currX - pt.x
            const dy = mouse.currY - pt.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < gravityRadius) {
              const u = 1 - dist / gravityRadius
              const alpha = u * 0.45 * massStrength
              ctx.beginPath()
              ctx.arc(pt.x, pt.y, 1.2 + u * 1.5, 0, Math.PI * 2)
              ctx.fillStyle = u > 0.75
                ? `rgba(165, 180, 252, ${alpha * 0.95})` // Vivid Indigo core
                : `rgba(129, 140, 248, ${alpha * 0.75})` // Soft Violet ring
              ctx.fill()
            }
          }
        }
      }

      // ── Draw Center Gravitational Lens Glow ──
      if (showGravitationalLens && massStrength > 0.05) {
        const lensRadius = gravityRadius * 0.5
        const grad = ctx.createRadialGradient(
          mouse.currX,
          mouse.currY,
          0,
          mouse.currX,
          mouse.currY,
          lensRadius
        )
        grad.addColorStop(0, `rgba(99, 102, 241, ${0.18 * massStrength})`) // Cosmic Indigo center
        grad.addColorStop(0.28, `rgba(129, 140, 248, ${0.08 * massStrength})`)
        grad.addColorStop(0.65, `rgba(79, 70, 229, ${0.03 * massStrength})`)
        grad.addColorStop(1, 'rgba(7, 7, 20, 0)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mouse.currX, mouse.currY, lensRadius, 0, Math.PI * 2)
        ctx.fill()

        // Tiny central singularity / gravitational focal point
        ctx.beginPath()
        ctx.arc(mouse.currX, mouse.currY, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(224, 231, 255, ${0.9 * massStrength})`
        ctx.fill()
      }

      // If inactive and grid has settled to resting position, put loop to sleep
      if (!mouse.isActive && totalDisplacement < 0.2 && ripples.length === 0) {
        isRunning = false
        return
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
    }
  }, [spacing, gravityRadius, maxConvergence, showGravitationalLens])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  )
}
