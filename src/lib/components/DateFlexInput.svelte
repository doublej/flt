<script lang="ts">
let {
  value = $bindable(''),
  daysBefore = $bindable(0),
  daysAfter = $bindable(0),
  min = '',
  label,
  id,
  required = false,
}: {
  value: string
  daysBefore: number
  daysAfter: number
  min: string
  label: string
  id: string
  required?: boolean
} = $props()

const maxPerSide = 3
</script>

<div class="field">
	<label class="label" for={id}>{label}</label>
	<div class="date-flex">
		<div class="flex-btns">
			<button
				type="button"
				class="flex-btn"
				onclick={() => { if (daysBefore < maxPerSide) daysBefore++ }}
				disabled={daysBefore >= maxPerSide}
				title="Add earlier day"
			>+</button>
			<button
				type="button"
				class="flex-btn"
				onclick={() => { if (daysBefore > 0) daysBefore-- }}
				disabled={daysBefore === 0}
				title="Remove earlier day"
			>&minus;</button>
		</div>
		{#if daysBefore > 0}
			<div class="stripes">
				{#each { length: daysBefore } as _}
					<div class="stripe"></div>
				{/each}
			</div>
		{/if}
		<input {id} type="date" bind:value min={min} {required} title="Select {label.toLowerCase()} date" />
		{#if daysAfter > 0}
			<div class="stripes">
				{#each { length: daysAfter } as _}
					<div class="stripe"></div>
				{/each}
			</div>
		{/if}
		<div class="flex-btns">
			<button
				type="button"
				class="flex-btn"
				onclick={() => { if (daysAfter < maxPerSide) daysAfter++ }}
				disabled={daysAfter >= maxPerSide}
				title="Add later day"
			>+</button>
			<button
				type="button"
				class="flex-btn"
				onclick={() => { if (daysAfter > 0) daysAfter-- }}
				disabled={daysAfter === 0}
				title="Remove later day"
			>&minus;</button>
		</div>
	</div>
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
	}
	.label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-muted);
		margin-bottom: 4px;
	}
	.date-flex {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.flex-btns {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex-shrink: 0;
	}
	.flex-btn {
		width: 24px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface);
		color: var(--color-muted);
		font-size: 0.7rem;
		line-height: 1;
		padding: 0;
	}
	.flex-btn:hover:not(:disabled) {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	.flex-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.stripes {
		display: flex;
		gap: 3px;
		align-items: center;
	}
	.stripe {
		width: 6px;
		height: 32px;
		border-radius: 3px;
		background: var(--color-primary);
		opacity: 0.4;
	}
	input {
		flex: 1;
		min-width: 0;
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.95rem;
		background: var(--color-surface);
	}
	input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgb(26 115 232 / 0.15);
	}
</style>
