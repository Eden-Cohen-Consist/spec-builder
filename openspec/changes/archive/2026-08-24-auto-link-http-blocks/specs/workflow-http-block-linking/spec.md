## Purpose

Lets a Hebrew, non-developer PM create and connect an HTTP workflow step to its technical integration contract without navigating back and forth between wizard steps.

## ADDED Requirements

### Requirement: HTTP nodes auto-link via reusable default slots
When the PM adds a **קריאת API** node, the system SHALL immediately link it to a technical HTTP Request block. The system SHALL reuse an existing empty, unlinked HTTP Request block titled **קריאת API** when one exists; otherwise it SHALL create one with that default title and link the node to it.

#### Scenario: Add the first HTTP node
- **WHEN** the PM adds a **קריאת API** node while the document has no HTTP Request blocks
- **THEN** one HTTP Request block is created with the title **קריאת API**
- **AND** the node is linked to the created block
- **AND** the PM remains on the workflow step with the node side panel open

#### Scenario: Reuse an empty default slot
- **WHEN** the PM adds a **קריאת API** node
- **AND** an HTTP Request block titled **קריאת API** exists with no HTTP details beyond its title and defaults
- **AND** no workflow node currently links to that block
- **THEN** the node links to that existing block
- **AND** no duplicate HTTP Request block is created

#### Scenario: Create a new default block when no slot exists
- **WHEN** the PM adds a **קריאת API** node
- **AND** every existing HTTP Request block is either linked, populated, or not titled **קריאת API**
- **THEN** the system creates one HTTP Request block titled **קריאת API**
- **AND** links the node to the created block

#### Scenario: Created block appears on the technical-block step
- **WHEN** the PM advances from the workflow step after the system linked an HTTP Request block
- **THEN** the linked block appears in **בלוקים טכניים** ready for its HTTP details to be completed

### Requirement: The side panel supports manual block selection
The HTTP node side panel SHALL let the PM link a different existing HTTP Request block or explicitly create and link a new one.

#### Scenario: Link a different existing block
- **WHEN** the PM chooses a different existing HTTP Request block in the node side panel
- **THEN** the node links to that block
- **AND** no new block is created
- **AND** the previously linked block is not deleted

#### Scenario: Create a new block from the side panel
- **WHEN** the PM chooses **יצירת בלוק חדש** in the node side panel
- **THEN** the system immediately creates one HTTP Request block with the current node title
- **AND** links the node to the created block
- **AND** keeps the PM on the workflow step

#### Scenario: Change the selected block
- **WHEN** the PM selects a different existing HTTP Request block in the node side panel
- **THEN** the node links to the newly selected block
- **AND** the previously linked block is not deleted

### Requirement: A new block title follows its node title until independently edited
The system SHALL keep the title of a newly created or auto-linked HTTP Request block equal to its originating node title while their titles still match. Once the PM gives the block a different title in **בלוקים טכניים**, later node-title edits MUST NOT overwrite the block title.

#### Scenario: Rename a node before editing its block title
- **WHEN** a node and its auto-linked block have matching titles
- **AND** the PM changes the node title
- **THEN** the linked block title changes to the same value

#### Scenario: Rename a node after editing its block title
- **WHEN** the PM has changed the linked block title so it differs from the node title
- **AND** the PM later changes the node title
- **THEN** the linked block title remains unchanged

#### Scenario: Existing blocks are not renamed on manual selection
- **WHEN** the PM links an HTTP node to a different existing HTTP Request block through the side panel
- **THEN** the existing block title remains unchanged

### Requirement: Node deletion safely cleans up an unused empty block
Deleting an HTTP node SHALL delete its linked HTTP Request block only when no other workflow node links to that block and the block contains no HTTP details other than its title and factory defaults. A populated or shared block MUST remain available in **בלוקים טכניים**.

#### Scenario: Delete a node linked to an unused empty block
- **WHEN** the PM deletes an HTTP node
- **AND** no other workflow node links to its block
- **AND** the linked block has no HTTP details beyond its title and defaults
- **THEN** the linked block is deleted

#### Scenario: Preserve a shared block
- **WHEN** the PM deletes an HTTP node whose linked block is also linked from another workflow node
- **THEN** the linked block remains available and linked to the other node

#### Scenario: Preserve a populated block
- **WHEN** the PM deletes an HTTP node whose linked block contains any entered HTTP detail
- **THEN** the linked block remains available in **בלוקים טכניים**

#### Scenario: Unlink without deleting
- **WHEN** the PM changes an HTTP node from one linked block to another or to no linked block
- **THEN** the previously linked block remains available

### Requirement: Draft and export compatibility are preserved
The system SHALL persist the resulting nodes, links, blocks, and automatic-title ownership across reloads. Drafts saved before this capability MUST continue to load without migration work by the PM. Compiled JSON MUST continue to omit internal ids and UI-only metadata and represent an HTTP workflow step's `integrationBlock` using the matching exported technical-block name.

#### Scenario: Reload an automatically linked draft
- **WHEN** the PM reloads a draft containing an automatically linked block
- **THEN** its node-to-block link and automatic-title behavior are preserved

#### Scenario: Load an older draft
- **WHEN** the PM opens a draft created before automatic HTTP block linking was available
- **THEN** its existing workflow nodes and technical blocks load without data loss

#### Scenario: Export a newly linked HTTP node
- **WHEN** the PM exports a document containing an automatically linked HTTP Request block
- **THEN** the workflow step's `integrationBlock` equals that block's exported `name`
- **AND** the block appears once in `technicalBlocks`
- **AND** no internal id is present in the compiled JSON
