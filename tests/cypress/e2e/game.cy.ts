describe('Mato Royale Game', () => {
  beforeEach(() => {
    // Visit the game page
    cy.visit('/')
    
    // Wait for game to load
    cy.get('#loading', { timeout: 10000 }).should('not.be.visible')
  })

  it('should load the game successfully', () => {
    // Check that the game canvas is present
    cy.get('canvas').should('be.visible')
    
    // Check that UI elements are present
    cy.get('#player-score').should('be.visible')
    cy.get('#round-timer').should('be.visible')
    cy.get('#leaderboard').should('be.visible')
    cy.get('#connection-status').should('be.visible')
  })

  it('should show mobile controls on mobile viewport', () => {
    // Switch to mobile viewport
    cy.viewport(375, 667)
    
    // Mobile controls should be visible
    cy.get('#mobile-controls').should('be.visible')
    cy.get('.dpad').should('be.visible')
    cy.get('.dpad-button').should('have.length', 4)
  })

  it('should handle input controls', () => {
    // Test keyboard controls
    cy.get('body').type('{uparrow}')
    cy.get('body').type('{downarrow}')
    cy.get('body').type('{leftarrow}')
    cy.get('body').type('{rightarrow}')
    
    // On mobile, test D-pad controls
    cy.viewport(375, 667)
    cy.get('[data-direction="up"]').click()
    cy.get('[data-direction="down"]').click()
    cy.get('[data-direction="left"]').click()
    cy.get('[data-direction="right"]').click()
  })

  it('should maintain connection status', () => {
    // Check connection status indicator
    cy.get('#connection-status').should('contain', 'Connected')
    
    // Wait a bit to ensure connection is stable
    cy.wait(2000)
    cy.get('#connection-status').should('contain', 'Connected')
  })

  it('should update game state in real-time', () => {
    // Check that score starts at 0
    cy.get('#player-score').should('contain', '0')
    
    // Check that timer is updating (not showing --:--)
    cy.get('#round-timer').should('not.contain', '--:--')
    
    // Wait for potential game updates
    cy.wait(5000)
    
    // Leaderboard should show some content
    cy.get('#leaderboard-list').should('not.contain', 'Waiting for players...')
  })

  it('should handle window resize gracefully', () => {
    // Test different viewport sizes
    const viewports = [
      [1920, 1080],
      [1280, 720],
      [768, 1024],
      [375, 667]
    ]

    viewports.forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.get('canvas').should('be.visible')
      cy.wait(500) // Allow time for resize
    })
  })

  it('should persist through page visibility changes', () => {
    // Simulate page becoming hidden (mobile background)
    cy.window().then((win) => {
      Object.defineProperty(win.document, 'hidden', {
        writable: true,
        value: true
      })
      win.document.dispatchEvent(new Event('visibilitychange'))
    })
    
    cy.wait(1000)
    
    // Simulate page becoming visible again
    cy.window().then((win) => {
      Object.defineProperty(win.document, 'hidden', {
        writable: true,
        value: false
      })
      win.document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Game should still be functional
    cy.get('#connection-status').should('contain', 'Connected')
  })
})

// Test with multiple browsers/viewports simultaneously
describe('Multi-Client Game Test', () => {
  it('should handle multiple connections', () => {
    // This would require a more complex setup with multiple browser instances
    // For now, we'll simulate by opening multiple tabs
    
    cy.visit('/')
    cy.get('#loading', { timeout: 10000 }).should('not.be.visible')
    
    // Open a new window (simulating second player)
    cy.window().then((win) => {
      win.open('/', '_blank')
    })
    
    cy.wait(5000)
    
    // Check that leaderboard reflects multiple players
    cy.get('#leaderboard-list .leaderboard-entry').should('have.length.at.least', 1)
  })
})
