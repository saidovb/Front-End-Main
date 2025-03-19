document.addEventListener('DOMContentLoaded', function() {
    const link1 = document.getElementById('link1');
    const link2 = document.getElementById('link2');
    let isActive = false;

    function toggleStylesheet() {
        isActive = !isActive;
        link1.disabled = isActive;
        link2.disabled = !isActive;
    }

    // Click event (PC + Mobile)
    document.body.addEventListener('click', toggleStylesheet);

    // Touch event (Mobile devices)
    document.body.addEventListener('touchend', toggleStylesheet);

    // Keyboard event (any key toggles animation)
    document.addEventListener('keydown', function(event) {
        if (!event.ctrlKey && !event.altKey && !event.metaKey) {
            toggleStylesheet();
        }
    });
});