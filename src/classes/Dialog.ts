interface DialogContent {
    header: string;
    body: string;
    footer: string;
}

class Dialog {
    parent: HTMLElement;
    content: DialogContent;
    element: HTMLDialogElement;
    
    constructor(parent?: HTMLElement, content?: DialogContent) {
        this.parent = parent || document.body;
        this.content = content || { header: '', body: '', footer: '' };
        this.element = document.createElement('dialog');
        if(parent && content) this.render();
    }

    fromDOM(element: HTMLDialogElement) {
        this.parent = element.parentElement as HTMLElement;
        this.content = {
            header: element.querySelector('.dialog-header h2')?.textContent || '',
            body: element.querySelector('.dialog-body')?.innerHTML || '',
            footer: element.querySelector('.dialog-footer')?.innerHTML || ''
        
        };
        this.element = element;

    }

    render() {
        const dialog = document.createElement('dialog');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>${this.content.header}</h2>
            </div>
            <div class="dialog-body">
                ${this.content.body}
            </div>
            <div class="dialog-footer">
                ${this.content.footer}
            </div>
        `;
        this.parent.appendChild(dialog);
        this.element = dialog;
    }

    open() {
            this.element.showModal();
    }

    close() {
        this.element.close();
    }
}

export default Dialog;