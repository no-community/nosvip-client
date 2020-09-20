export default class TransferFile {
    constructor(file) {
        this.id = file.id;
        this.name = file.name;
        this.size = file.size;
        this.status = file.status;
        this.precent = 0;
    }
}